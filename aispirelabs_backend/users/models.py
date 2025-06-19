from django.db import models
from django.contrib.auth.models import AbstractUser
import uuid

class User(AbstractUser):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    # 'username', 'email', 'password', 'first_name', 'last_name' are already in AbstractUser
    # 'name' can be derived from first_name and last_name or use first_name as display name
    photoURL = models.CharField(max_length=200, blank=True, null=True)
    # emailVerified is part of AbstractUser as is_active (though slightly different meaning, can be adapted)
    # For simplicity, we'll use is_active for emailVerified or add a new field if strict adherence is needed.
    # Let's add email_verified explicitly for clarity
    email_verified = models.BooleanField(default=False)
    auth_provider = models.CharField(max_length=20, default='email') # 'email' or 'google'
    # createdAt is 'date_joined' in AbstractUser
    # updatedAt can be added if needed, or rely on log entries for changes
    # AbstractUser already has: username, first_name, last_name, email, password,
    # is_staff, is_active, date_joined, last_login

    # We can use first_name as the main display name or add a new field 'name'
    # For now, let's assume 'first_name' will be used as 'name' or can be combined with 'last_name'

    def __str__(self):
        return self.username
