from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.contrib.auth import authenticate, get_user_model
from django.contrib.auth.tokens import PasswordResetTokenGenerator
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes, force_str
from django.core.mail import send_mail
from django.conf import settings # To get frontend URL if configured

from rest_framework_simplejwt.tokens import RefreshToken
from .serializers import UserSerializer, RegisterSerializer, UserProfileSerializer, PasswordResetConfirmSerializer

UserModel = get_user_model()

class RegisterView(generics.CreateAPIView):
    queryset = UserModel.objects.all()
    permission_classes = (permissions.AllowAny,)
    serializer_class = RegisterSerializer

class UserProfileView(generics.RetrieveUpdateAPIView):
    queryset = UserModel.objects.all()
    serializer_class = UserProfileSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def get_object(self):
        return self.request.user

class LoginView(APIView):
    permission_classes = (permissions.AllowAny,)

    def post(self, request):
        username = request.data.get('username')  # This will be the email
        password = request.data.get('password')

        if not username or not password:
            return Response({
                'error': 'Please provide both email and password'
            }, status=status.HTTP_400_BAD_REQUEST)

        # Authenticate user using email
        user = authenticate(request, username=username, password=password)

        if user is None:
            return Response({
                'error': 'Invalid credentials'
            }, status=status.HTTP_401_UNAUTHORIZED)

        # Generate tokens
        refresh = RefreshToken.for_user(user)
        
        return Response({
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'user': {
                'id': str(user.id),
                'username': user.username,
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'photoURL': user.photoURL if hasattr(user, 'photoURL') else None,
                'user_type': user.user_type, # Added user_type
            }
        }, status=status.HTTP_200_OK)


class RequestPasswordResetView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        email = request.data.get('email')
        if not email:
            return Response({'error': 'Email address is required.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user = UserModel.objects.get(email=email)
        except UserModel.DoesNotExist:
            # Avoid user enumeration
            return Response({'message': 'If an account with this email exists, a password reset link has been sent.'}, status=status.HTTP_200_OK)

        if not user.is_active:
            return Response({'error': 'User account is inactive.'}, status=status.HTTP_400_BAD_REQUEST)

        token_generator = PasswordResetTokenGenerator()
        uidb64 = urlsafe_base64_encode(force_bytes(user.pk))
        token = token_generator.make_token(user)

        # TODO: Make FRONTEND_URL configurable in settings.py
        FRONTEND_URL = getattr(settings, 'FRONTEND_URL', 'http://localhost:3000')
        reset_url = f"{FRONTEND_URL}/reset-password/{uidb64}/{token}/"

        subject = 'Reset Your Acharya AI Password'
        message = f"""
        <p>Hello {user.first_name or user.username},</p>
        <p>You requested a password reset for your Acharya AI account.</p>
        <p>Please click the link below to set a new password:</p>
        <p><a href="{reset_url}">{reset_url}</a></p>
        <p>If you did not request this, please ignore this email.</p>
        <p>This link will expire in a short period for security reasons.</p>
        <p>Thanks,<br>The Acharya AI Team</p>
        """

        try:
            send_mail(
                subject,
                '', # Plain text part - Django will use html_message if provided
                settings.DEFAULT_FROM_EMAIL if hasattr(settings, 'DEFAULT_FROM_EMAIL') else 'noreply@acharyaai.com', # Sender
                [user.email],
                fail_silently=False,
                html_message=message
            )
        except Exception as e:
            # Log this error e.g. using logging module
            print(f"Error sending password reset email: {e}") # For dev, print to console
            return Response({'error': 'Failed to send password reset email. Please try again later.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        return Response({'message': 'If an account with this email exists, a password reset link has been sent.'}, status=status.HTTP_200_OK)


class ConfirmPasswordResetView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        uidb64 = request.data.get('uidb64')
        token = request.data.get('token')
        new_password = request.data.get('new_password') # Get directly for now, or use serializer

        serializer = PasswordResetConfirmSerializer(data={'new_password': new_password})
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        new_password = serializer.validated_data['new_password']


        if not all([uidb64, token, new_password]):
            return Response({'error': 'Missing uidb64, token, or new_password.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user_id = force_str(urlsafe_base64_decode(uidb64))
            user = UserModel.objects.get(pk=user_id)
        except (TypeError, ValueError, OverflowError, UserModel.DoesNotExist):
            user = None

        if user is None:
            return Response({'error': 'Invalid user ID.'}, status=status.HTTP_400_BAD_REQUEST)

        token_generator = PasswordResetTokenGenerator()
        if not token_generator.check_token(user, token):
            return Response({'error': 'Invalid or expired token. Please request a new password reset.'}, status=status.HTTP_400_BAD_REQUEST)

        user.set_password(new_password)
        user.save()
        return Response({'message': 'Password has been reset successfully.'}, status=status.HTTP_200_OK)
