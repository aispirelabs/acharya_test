
from django.urls import path
from . import views

urlpatterns = [
    path('register/', views.sign_up, name='sign_up'),
    path('signin/', views.sign_in, name='sign_in'),
    path('google-signin/', views.google_sign_in, name='google_sign_in'),
    path('current-user/', views.current_user, name='current_user'),
    path('update-avatar/', views.update_avatar, name='update_avatar'),
    path('signout/', views.sign_out, name='sign_out'),
]
