from django.db import models
from users.models import User # Assuming User model is in 'users' app
import uuid

class Interview(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    # User who takes/owns the interview (candidate). Can be null if HR creates it as a template or for multiple candidates.
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='interviews', null=True, blank=True)
    role = models.CharField(max_length=255)
    type = models.CharField(max_length=100) # e.g., "behavioural", "technical"
    level = models.CharField(max_length=100) # e.g., "entry", "senior"
    techstack = models.JSONField(default=list, blank=True) # Ensure default is list
    questions = models.JSONField(default=list, blank=True, null=True) # Ensure default and nullable
    finalized = models.BooleanField(default=True)
    cover_image = models.URLField(max_length=255, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    # HR Specific fields
    hr_creator = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='hr_created_interviews')
    is_hr_created = models.BooleanField(default=False)
    candidate_emails = models.JSONField(default=list, blank=True) # List of emails for HR-created interviews
    show_feedback_to_candidate = models.BooleanField(default=True) # HR can control this
    attempt_limit = models.PositiveIntegerField(default=1) # Max attempts for candidate on this HR interview

    def __str__(self):
        return f"Interview for {self.role} ({self.id})"

class Feedback(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    interview = models.ForeignKey(Interview, on_delete=models.CASCADE, related_name='feedbacks')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='feedbacks') # User who took the interview attempt

    # Fields for AI-generated feedback - can be nullable if feedback is pending
    total_score = models.IntegerField(null=True, blank=True)
    category_scores = models.JSONField(default=list, blank=True) # Stores list of dicts: {name, score, comment}
    strengths = models.JSONField(default=list, blank=True) # Stores list of strings
    areas_for_improvement = models.JSONField(default=list, blank=True) # Stores list of strings
    final_assessment = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    # New fields for interview attempt state management
    questions_log = models.JSONField(default=list, blank=True) # Stores [{text, timestamp}]
    answers_log = models.JSONField(default=list, blank=True) # Stores [{question_text, answer_text, timestamp}]
    current_question_index = models.IntegerField(default=0)
    SESSION_STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('started', 'Started'),
        ('in_progress', 'In Progress'),
        ('completed', 'Completed'),
        ('terminated', 'Terminated')
    ]
    session_status = models.CharField(
        max_length=20,
        choices=SESSION_STATUS_CHOICES,
        default='pending'
    )

    def __str__(self):
        return f"Feedback for Interview {self.interview.id} by User {self.user.username}"


class InterviewWarning(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    feedback_attempt = models.ForeignKey(Feedback, on_delete=models.CASCADE, related_name='warnings')
    timestamp = models.DateTimeField(auto_now_add=True)
    reason = models.CharField(max_length=255, default='Loss of focus detected') # e.g., "Tab Switch", "Loss of Focus"
    details = models.JSONField(null=True, blank=True) # Optional: for extra context from frontend

    def __str__(self):
        return f"Warning for feedback attempt {self.feedback_attempt.id} at {self.timestamp} ({self.reason})"

    class Meta:
        ordering = ['timestamp']
