from rest_framework.permissions import BasePermission

class IsHRUser(BasePermission):
    """
    Allows access only to users with user_type 'hr'.
    """
    def has_permission(self, request, view):
        # Ensure user is authenticated and has the user_type attribute
        if not (request.user and request.user.is_authenticated):
            return False

        # Check if the user_type attribute exists and is 'hr'
        # This relies on the custom User model having a 'user_type' field.
        return getattr(request.user, 'user_type', None) == 'hr'

    def has_object_permission(self, request, view, obj):
        """
        Object-level permission to only allow HR users.
        Can be refined if HR users should only access objects they created, etc.
        For now, if they have view-level permission, they have object-level.
        """
        if not (request.user and request.user.is_authenticated):
            return False
        return getattr(request.user, 'user_type', None) == 'hr'
