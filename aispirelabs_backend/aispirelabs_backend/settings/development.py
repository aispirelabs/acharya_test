from .base import *

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = True

ALLOWED_HOSTS = ["*"]

# CORS settings for development
CORS_ALLOWED_ORIGINS = [
    "https://fb2205e3-2136-4f24-a518-fa659461fdb5-00-iy0uqwcnvvpq.pike.replit.dev"
]

CORS_ALLOW_CREDENTIALS = True
CORS_ALLOW_ALL_ORIGINS = False  # Set to True only in development if needed

# Additional development settings
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
        },
    },
    'root': {
        'handlers': ['console'],
        'level': 'INFO',
    },
}
