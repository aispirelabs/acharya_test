
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ('email', 'name', 'auth_provider', 'is_active', 'created_at')
    list_filter = ('auth_provider', 'is_active', 'created_at')
    search_fields = ('email', 'name')
    ordering = ('-created_at',)
    
    fieldsets = BaseUserAdmin.fieldsets + (
        ('Additional Info', {
            'fields': ('name', 'photo_url', 'auth_provider')
        }),
    )
    
    add_fieldsets = BaseUserAdmin.add_fieldsets + (
        ('Additional Info', {
            'fields': ('email', 'name', 'photo_url', 'auth_provider')
        }),
    )
