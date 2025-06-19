
from rest_framework import serializers
from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from .models import User


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'email', 'name', 'photo_url', 'auth_provider', 'created_at')
        read_only_fields = ('id', 'created_at')


class SignUpSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, validators=[validate_password])
    password_confirm = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ('email', 'name', 'password', 'password_confirm')

    def validate(self, attrs):
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError("Passwords don't match")
        return attrs

    def create(self, validated_data):
        validated_data.pop('password_confirm', None)
        user = User.objects.create_user(
            email=validated_data['email'],
            username=validated_data['email'],  # Use email as username
            name=validated_data['name'],
            password=validated_data['password'],
            auth_provider='email'
        )
        return user


class SignInSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField()

    def validate(self, attrs):
        email = attrs.get('email')
        password = attrs.get('password')

        if email and password:
            user = authenticate(username=email, password=password)
            if not user:
                raise serializers.ValidationError('Invalid credentials')
            if not user.is_active:
                raise serializers.ValidationError('Account is deactivated')
            attrs['user'] = user
        else:
            raise serializers.ValidationError('Must include email and password')

        return attrs


class GoogleSignInSerializer(serializers.Serializer):
    email = serializers.EmailField()
    name = serializers.CharField()
    photo_url = serializers.URLField(required=False)

    def validate(self, attrs):
        email = attrs.get('email')
        name = attrs.get('name')
        
        # Check if user exists
        try:
            user = User.objects.get(email=email)
            # Update user info if it's a Google user
            if user.auth_provider == 'google':
                user.name = name
                if attrs.get('photo_url'):
                    user.photo_url = attrs.get('photo_url')
                user.save()
            attrs['user'] = user
        except User.DoesNotExist:
            # Create new Google user
            user = User.objects.create_user(
                email=email,
                username=email,
                name=name,
                photo_url=attrs.get('photo_url', '/user-avatar.jpg'),
                auth_provider='google'
            )
            attrs['user'] = user

        return attrs


class UpdateAvatarSerializer(serializers.Serializer):
    photo_url = serializers.URLField()
