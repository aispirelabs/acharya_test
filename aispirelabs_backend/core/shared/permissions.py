
from rest_framework import permissions


class IsOwnerOrReadOnly(permissions.BasePermission):
    """Custom permission to only allow owners to edit objects"""
    
    def has_object_permission(self, request, view, obj):
        # Read permissions for any request
        if request.method in permissions.SAFE_METHODS:
            return True
        
        # Write permissions only to the owner
        return obj.user == request.user


class IsOwner(permissions.BasePermission):
    """Custom permission to only allow owners to access objects"""
    
    def has_object_permission(self, request, view, obj):
        return obj.user == request.user
