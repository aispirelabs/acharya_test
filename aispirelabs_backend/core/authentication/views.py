
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from django.contrib.auth import get_user_model

from .serializers import (
    SignUpSerializer, 
    SignInSerializer, 
    GoogleSignInSerializer,
    UserSerializer,
    UpdateAvatarSerializer
)
from .helpers import generate_jwt_token

User = get_user_model()


@api_view(['POST'])
@permission_classes([AllowAny])
def sign_up(request):
    try:
        serializer = SignUpSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            return Response({
                'success': True,
                'message': 'Account created successfully. Please sign in.',
                'user': UserSerializer(user).data
            }, status=status.HTTP_201_CREATED)
        return Response({
            'success': False,
            'errors': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        return Response({
            'success': False,
            'message': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([AllowAny])
def sign_in(request):
    try:
        serializer = SignInSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.validated_data['user']
            token = generate_jwt_token(user)
            return Response({
                'success': True,
                'message': 'Signed in successfully.',
                'token': token,
                'user': UserSerializer(user).data
            }, status=status.HTTP_200_OK)
        print(serializer.errors)
        return Response({
            'success': False,
            'errors': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        print(e)
        return Response({
            'success': False,
            'message': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([AllowAny])
def google_sign_in(request):
    serializer = GoogleSignInSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.validated_data['user']
        token = generate_jwt_token(user)
        return Response({
            'success': True,
            'message': 'Google sign in successful.',
            'token': token,
            'user': UserSerializer(user).data
        }, status=status.HTTP_200_OK)
    return Response({
        'success': False,
        'errors': serializer.errors
    }, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def current_user(request):
    serializer = UserSerializer(request.user)
    return Response({
        'success': True,
        'user': serializer.data
    }, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def update_avatar(request):
    serializer = UpdateAvatarSerializer(data=request.data)
    if serializer.is_valid():
        request.user.photo_url = serializer.validated_data['photo_url']
        request.user.save()
        return Response({
            'success': True,
            'message': 'Avatar updated successfully!',
            'user': UserSerializer(request.user).data
        }, status=status.HTTP_200_OK)
    return Response({
        'success': False,
        'errors': serializer.errors
    }, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def sign_out(request):
    # Since JWT is stateless, we just return success
    # Token expiration is handled client-side
    return Response({
        'success': True,
        'message': 'Signed out successfully.'
    }, status=status.HTTP_200_OK)
