
from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('core.authentication.urls')),
    path('api/acharya-ai/', include('products.acharya_ai.urls')),
]
