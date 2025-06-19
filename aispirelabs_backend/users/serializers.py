from rest_framework import serializers
from .models import User # Assuming User model is in .models
from django.contrib.auth.hashers import make_password
from django.contrib.auth import get_user_model

UserModel = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserModel
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'photoURL', 'email_verified', 'auth_provider', 'date_joined', 'last_login', 'password']
        read_only_fields = ['id', 'email_verified', 'auth_provider', 'date_joined', 'last_login']
        extra_kwargs = {
            'password': {'write_only': True, 'required': False, 'allow_null': True},
        }

    def update(self, instance, validated_data):
        password = validated_data.pop('password', None)
        if password:
            instance.set_password(password)
        return super().update(instance, validated_data)

class RegisterSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserModel
        fields = ['username', 'email', 'password', 'first_name', 'last_name', 'photoURL']
        extra_kwargs = {
            'password': {'write_only': True, 'style': {'input_type': 'password'}, 'min_length': 8},
            'email': {'required': True},
            'username': {'required': True},
            'photoURL': {'required': False, 'allow_blank': True, 'default': ''},
            'first_name': {'required': False, 'allow_blank': True, 'default': ''},
            'last_name': {'required': False, 'allow_blank': True, 'default': ''},
        }

    def create(self, validated_data):
        user = UserModel.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password'],
            first_name=validated_data.get('first_name'),
            last_name=validated_data.get('last_name'),
            photoURL=validated_data.get('photoURL'),
            auth_provider='email',
            email_verified=False
        )
        return user
