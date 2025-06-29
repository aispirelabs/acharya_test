from django.contrib import admin
from .models import User

# Register your models here.
class UserAdmin(admin.ModelAdmin):
    list_display = ('username', 'email', 'first_name', 'last_name', 'photoURL', 'email_verified', 'auth_provider', 'date_joined', 'last_login')
    search_fields = ('username', 'email', 'first_name', 'last_name')
    list_filter = ('email_verified', 'auth_provider', 'date_joined', 'last_login')
    ordering = ('-date_joined',)

admin.site.register(User, UserAdmin)