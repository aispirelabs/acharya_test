from django.urls import path
from .views import (
    RegisterView,
    UserProfileView,
    LoginView,
    RequestPasswordResetView,
    ConfirmPasswordResetView
)
from rest_framework_simplejwt.views import (
    TokenRefreshView,
)

urlpatterns = [
    path('register/', RegisterView.as_view(), name='user_register'),
    path('login/', LoginView.as_view(), name='custom_login'),
    path('login/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('profile/', UserProfileView.as_view(), name='user_profile'),
    path('password-reset/request/', RequestPasswordResetView.as_view(), name='password_reset_request'),
    path('password-reset/confirm/', ConfirmPasswordResetView.as_view(), name='password_reset_confirm'),
]
