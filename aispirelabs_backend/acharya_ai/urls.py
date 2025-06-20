
from django.urls import path
from .views import (
    InterviewCreateView, InterviewListView, InterviewDetailView,
    FeedbackCreateView, FeedbackListView, FeedbackByInterviewView,
    HRAnalyticsView, HRInterviewsListView, InterviewInvitationsView,
    AcceptInvitationView, InvitationByTokenView
)

urlpatterns = [
    # Interview endpoints
    path('interviews/', InterviewListView.as_view(), name='interviews_list'),
    path('interviews/create/', InterviewCreateView.as_view(), name='create_interview'),
    path('interviews/<uuid:pk>/', InterviewDetailView.as_view(), name='interview_detail'),
    path('interviews/<uuid:interview_id>/feedback/', FeedbackByInterviewView.as_view(), name='get_interview_feedback'),
    path('interviews/<uuid:interview_id>/invitations/', InterviewInvitationsView.as_view(), name='get_interview_invitations'),

    # Feedback endpoints
    path('feedback/create/', FeedbackCreateView.as_view(), name='create_feedback'),
    path('feedback/interview/<uuid:interview_id>/', FeedbackByInterviewView.as_view(), name='get_feedback_by_interview'),

    # HR endpoints
    path('hr/analytics/', HRAnalyticsView.as_view(), name='hr_analytics'),
    path('hr/interviews/', HRInterviewsListView.as_view(), name='hr_interviews_list'),

    # Invitation endpoints
    path('invitations/<uuid:invitation_id>/accept/', AcceptInvitationView.as_view(), name='accept_invitation'),
    path('invitations/<str:token>/', InvitationByTokenView.as_view(), name='get_invitation_by_token'),
]
