
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.contrib.auth import authenticate, update_session_auth_hash
from django.contrib.auth.tokens import default_token_generator
from django.contrib.sites.shortcuts import get_current_site
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes, force_str
from django.conf import settings
from rest_framework_simplejwt.tokens import RefreshToken
from .serializers import (
    UserSerializer, UserRegistrationSerializer, 
    ChangePasswordSerializer, PasswordResetSerializer,
    PasswordResetConfirmSerializer
)
from django.contrib.auth import get_user_model

UserModel = get_user_model()


class RegisterView(generics.CreateAPIView):
    queryset = UserModel.objects.all()
    permission_classes = (permissions.AllowAny, )
    serializer_class = UserRegistrationSerializer


class UserProfileView(generics.RetrieveUpdateAPIView):
    queryset = UserModel.objects.all()
    serializer_class = UserSerializer
    permission_classes = (permissions.IsAuthenticated, )

    def get_object(self):
        return self.request.user


class LoginView(APIView):
    permission_classes = (permissions.AllowAny, )

    def post(self, request):
        username = request.data.get('username')  # This will be the email
        password = request.data.get('password')

        if not username or not password:
            return Response(
                {'error': 'Please provide both email and password'},
                status=status.HTTP_400_BAD_REQUEST)

        # Authenticate user using email
        user = authenticate(request, username=username, password=password)

        if user is None:
            return Response({'error': 'Invalid credentials'},
                            status=status.HTTP_401_UNAUTHORIZED)

        # Generate tokens
        refresh = RefreshToken.for_user(user)

        return Response(
            {
                'access': str(refresh.access_token),
                'refresh': str(refresh),
                'user': {
                    'id': str(user.id),
                    'username': user.username,
                    'email': user.email,
                    'first_name': user.first_name,
                    'last_name': user.last_name,
                    'user_type': user.user_type,
                    'company': user.company,
                    'position': user.position,
                    'phone': getattr(user, 'phone', None),
                    'photoURL': user.photoURL,
                }
            },
            status=status.HTTP_200_OK)


class ChangePasswordView(APIView):
    permission_classes = (permissions.IsAuthenticated, )

    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data)
        if serializer.is_valid():
            user = request.user
            old_password = serializer.validated_data['old_password']
            new_password = serializer.validated_data['new_password']

            if not user.check_password(old_password):
                return Response(
                    {'error': 'Invalid old password'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            user.set_password(new_password)
            user.save()
            update_session_auth_hash(request, user)

            return Response(
                {'message': 'Password changed successfully'},
                status=status.HTTP_200_OK
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class PasswordResetView(APIView):
    permission_classes = (permissions.AllowAny, )

    def post(self, request):
        serializer = PasswordResetSerializer(data=request.data)
        if serializer.is_valid():
            email = serializer.validated_data['email']
            try:
                user = UserModel.objects.get(email=email)
                
                # Generate password reset token
                token = default_token_generator.make_token(user)
                uid = urlsafe_base64_encode(force_bytes(user.pk))
                
                # Create reset link
                current_site = get_current_site(request)
                reset_link = f"http://{current_site.domain}/auth/reset-password/{uid}/{token}/"
                
                # Send email (you can customize this)
                subject = 'Password Reset - Acharya AI'
                message = f'''
                Hi {user.first_name},
                
                You requested a password reset for your Acharya AI account.
                
                Click the link below to reset your password:
                {reset_link}
                
                If you didn't request this, please ignore this email.
                
                Best regards,
                Acharya AI Team
                '''
                
                send_mail(
                    subject,
                    message,
                    settings.DEFAULT_FROM_EMAIL,
                    [email],
                    fail_silently=False,
                )
                
                return Response(
                    {'message': 'Password reset email sent'},
                    status=status.HTTP_200_OK
                )
            except UserModel.DoesNotExist:
                # Return success even if user doesn't exist for security
                return Response(
                    {'message': 'Password reset email sent'},
                    status=status.HTTP_200_OK
                )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class PasswordResetConfirmView(APIView):
    permission_classes = (permissions.AllowAny, )

    def post(self, request):
        serializer = PasswordResetConfirmSerializer(data=request.data)
        if serializer.is_valid():
            uid = serializer.validated_data['uid']
            token = serializer.validated_data['token']
            new_password = serializer.validated_data['new_password']
            
            try:
                user_id = force_str(urlsafe_base64_decode(uid))
                user = UserModel.objects.get(pk=user_id)
                
                if default_token_generator.check_token(user, token):
                    user.set_password(new_password)
                    user.save()
                    
                    return Response(
                        {'message': 'Password reset successfully'},
                        status=status.HTTP_200_OK
                    )
                else:
                    return Response(
                        {'error': 'Invalid token'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
            except (TypeError, ValueError, OverflowError, UserModel.DoesNotExist):
                return Response(
                    {'error': 'Invalid token'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
