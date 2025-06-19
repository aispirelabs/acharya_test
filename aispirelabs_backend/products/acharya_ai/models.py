
from django.db import models
from django.contrib.auth import get_user_model
from core.shared.models import Timestamps

User = get_user_model()


class Interview(Timestamps):
    INTERVIEW_TYPES = [
        ('behavioral', 'Behavioral'),
        ('technical', 'Technical'),
        ('mixed', 'Mixed'),
    ]
    
    EXPERIENCE_LEVELS = [
        ('entry level', 'Entry Level'),
        ('beginner', 'Beginner'),
        ('junior', 'Junior'),
        ('intermediate', 'Intermediate'),
        ('senior', 'Senior'),
        ('advanced', 'Advanced'),
        ('expert', 'Expert'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='interviews')
    role = models.CharField(max_length=100)
    type = models.CharField(max_length=20, choices=INTERVIEW_TYPES)
    level = models.CharField(max_length=20, choices=EXPERIENCE_LEVELS)
    techstack = models.JSONField(default=list)  # Store as list of strings
    questions = models.JSONField(default=list)  # Store as list of strings
    cover_image = models.URLField(blank=True, null=True)
    finalized = models.BooleanField(default=False)

    class Meta:
        db_table = 'interviews'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.role} - {self.type} ({self.user.email})"


class Feedback(Timestamps):
    interview = models.OneToOneField(Interview, on_delete=models.CASCADE, related_name='feedback')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='feedbacks')
    transcript = models.JSONField(default=list)  # Store conversation messages
    total_score = models.IntegerField(default=0)
    detailed_feedback = models.JSONField(default=dict)  # Store detailed analysis
    
    class Meta:
        db_table = 'feedbacks'
        ordering = ['-created_at']

    def __str__(self):
        return f"Feedback for {self.interview.role} - {self.user.email}"


class InterviewAttempt(Timestamps):
    interview = models.ForeignKey(Interview, on_delete=models.CASCADE, related_name='attempts')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='interview_attempts')
    status = models.CharField(max_length=20, default='in_progress')
    score = models.IntegerField(default=0)
    feedback_data = models.JSONField(default=dict)
    
    class Meta:
        db_table = 'interview_attempts'
        ordering = ['-created_at']

    def __str__(self):
        return f"Attempt - {self.interview.role} by {self.user.email}"
