
from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    email = models.EmailField(unique=True)
    name = models.CharField(max_length=100)
    photo_url = models.URLField(blank=True, null=True, default='/user-avatar.jpg')
    contact_number = models.CharField(max_length=15, blank=True, null=True)
    auth_provider = models.CharField(
        max_length=20, 
        choices=[('email', 'Email'), ('google', 'Google')], 
        default='email'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username', 'name']

    def __str__(self):
        return self.email

    class Meta:
        db_table = 'users'
