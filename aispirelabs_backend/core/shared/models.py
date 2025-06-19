
from django.db import models

class Timestamps(models.Model):
    """Model with timestamp fields"""
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    class Meta:
        abstract = True
        ordering = ['-created_at']
