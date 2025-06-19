from django.urls import path
from .views import (
    InterviewCreateView,
    InterviewListView,
    InterviewDetailView,
    FeedbackCreateView,
    FeedbackListView,
)

urlpatterns = [
    path('interviews/', InterviewListView.as_view(), name='interview-list'),
    path('interviews/create/', InterviewCreateView.as_view(), name='interview-create'),
    path('interviews/<uuid:pk>/', InterviewDetailView.as_view(), name='interview-detail'),
    # pk is typically used for RetrieveUpdateDestroy views; for custom list, can use different URL
    path('interviews/<uuid:interview_id>/feedback/', FeedbackListView.as_view(), name='feedback-list-for-interview'),
    path('feedback/create/', FeedbackCreateView.as_view(), name='feedback-create'),
]
