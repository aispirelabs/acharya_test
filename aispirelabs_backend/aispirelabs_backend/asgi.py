
import os

from django.core.asgi import get_asgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'aispirelabs_backend.settings.development')

application = get_asgi_application()
