from django.urls import path
from .views import RegisterView, UserProfileView, LoginView
from rest_framework_simplejwt.views import (
    TokenRefreshView,
)

urlpatterns = [
    path('register/', RegisterView.as_view(), name='user_register'),
    path('login/', LoginView.as_view(), name='custom_login'),
    path('login/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('profile/', UserProfileView.as_view(), name='user_profile'),
]
