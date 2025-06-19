
from django.http import JsonResponse
from django.contrib.auth import get_user_model
from django.utils.deprecation import MiddlewareMixin
from core.authentication.helpers import verify_jwt_token

User = get_user_model()


class JWTAuthenticationMiddleware(MiddlewareMixin):
    """
    Middleware to handle JWT authentication for API requests
    """
    
    def process_request(self, request):
        # Skip authentication for certain paths
        skip_paths = [
            '/api/auth/signin/',
            '/api/auth/signup/',
            '/api/auth/google-signin/',
            '/admin/',
        ]
        
        if any(request.path.startswith(path) for path in skip_paths):
            return None
            
        # Only process API requests
        if not request.path.startswith('/api/'):
            return None
            
        # Get authorization header
        auth_header = request.META.get('HTTP_AUTHORIZATION')
        
        if not auth_header or not auth_header.startswith('Bearer '):
            return JsonResponse({
                'success': False,
                'error': 'Authentication required'
            }, status=401)
        
        try:
            token = auth_header.split(' ')[1]
            payload = verify_jwt_token(token)
            user = User.objects.get(id=payload['user_id'])
            request.user = user
            request.jwt_payload = payload
            
        except Exception as e:
            return JsonResponse({
                'success': False,
                'error': str(e)
            }, status=401)
        
        return None
