
from django.urls import path
from . import views

urlpatterns = [
    # Interview endpoints
    path('interviews/create/', views.create_interview, name='create_interview'),
    path('interviews/', views.get_interviews, name='get_interviews'),
    path('interviews/<int:interview_id>/', views.get_interview, name='get_interview'),
    
    # Feedback endpoints
    path('feedback/create/', views.create_feedback, name='create_feedback'),
    path('feedback/<int:interview_id>/', views.get_feedback, name='get_feedback'),
    
    # Interview attempts
    path('interviews/<int:interview_id>/attempts/', views.get_interview_attempts, name='get_interview_attempts'),
    
    # Dashboard
    path('dashboard/stats/', views.dashboard_stats, name='dashboard_stats'),
]
