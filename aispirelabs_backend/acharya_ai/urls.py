from django.urls import path
from .views import (
    InterviewCreateView,
    InterviewListView,
    InterviewDetailView,
    FeedbackCreateView,
    FeedbackListView,
    # HR Views
    HRInterviewListView,
    HRInterviewCreateView,
    HRInterviewDetailView,
    # Interview Attempt Views
    StartInterviewAttemptView,
    SubmitAnswerView,
    ReportInterviewWarningView,
    # Feedback Detail View
    FeedbackDetailView,
)

urlpatterns = [
    # Candidate facing URLs
    path('interviews/', InterviewListView.as_view(), name='interview-list'), # Candidate's own interviews
    path('interviews/create/', InterviewCreateView.as_view(), name='interview-create'), # Candidate creates interview
    path('interviews/<uuid:id>/', InterviewDetailView.as_view(), name='interview-detail'), # Candidate views own interview detail

    # Feedback URLs (likely candidate context for submitting feedback on their interview)
    path('interviews/<uuid:interview_id>/feedback/', FeedbackListView.as_view(), name='feedback-list-for-interview'),
    path('feedback/create/', FeedbackCreateView.as_view(), name='feedback-create'),

    # HR facing URLs
    path('hr/interviews/', HRInterviewListView.as_view(), name='hr-interview-list'),
    path('hr/interviews/create/', HRInterviewCreateView.as_view(), name='hr-interview-create'),
    path('hr/interviews/<uuid:id>/', HRInterviewDetailView.as_view(), name='hr-interview-detail'),

    # Interview Attempt URLs
    path('interviews/<uuid:interview_id>/start_attempt/', StartInterviewAttemptView.as_view(), name='interview-start-attempt'),
    path('feedback/<uuid:feedback_id>/submit_answer/', SubmitAnswerView.as_view(), name='interview-submit-answer'),
    path('feedback/<uuid:feedback_id>/report_warning/', ReportInterviewWarningView.as_view(), name='interview-report-warning'),
    # Feedback Detail URL
    path('feedback/<uuid:id>/', FeedbackDetailView.as_view(), name='feedback-detail'),
]
