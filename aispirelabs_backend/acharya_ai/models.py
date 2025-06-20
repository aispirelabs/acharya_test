from django.db import models
from users.models import User # Assuming User model is in 'users' app
import uuid

class Interview(models.Model):
    INTERVIEW_TYPE_CHOICES = (
        ('technical', 'Technical'),
        ('behavioral', 'Behavioral'),
        ('mixed', 'Mixed'),
    )
    
    LEVEL_CHOICES = (
        ('entry', 'Entry Level'),
        ('mid', 'Mid Level'),
        ('senior', 'Senior Level'),
        ('lead', 'Lead Level'),
    )
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='interviews') # Creator (HR or Candidate)
    title = models.CharField(max_length=255, blank=True, null=True) # Interview title for HR
    role = models.CharField(max_length=255) # Position/role name
    type = models.CharField(max_length=100, choices=INTERVIEW_TYPE_CHOICES) # e.g., "behavioral", "technical"
    level = models.CharField(max_length=100, choices=LEVEL_CHOICES) # e.g., "entry", "senior"
    techstack = models.JSONField() # Stores a list of strings
    questions = models.JSONField() # Stores a list of question strings
    job_description = models.TextField(blank=True, null=True)
    finalized = models.BooleanField(default=True)
    cover_image = models.URLField(max_length=255, blank=True, null=True)
    
    # HR-specific fields
    max_attempts = models.IntegerField(default=1) # Max attempts allowed per candidate
    time_limit = models.IntegerField(default=60) # Time limit in minutes
    show_feedback = models.BooleanField(default=True) # Whether to show feedback to candidates
    candidate_emails = models.JSONField(default=list, blank=True) # List of candidate emails
    # resume_template = models.FileField(upload_to='resumes/', blank=True, null=True)
    resume_url = models.CharField(max_length=255, blank=True, null=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Interview: {self.title or self.role} ({self.id})"

class InterviewInvitation(models.Model):
    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('accepted', 'Accepted'),
        ('completed', 'Completed'),
        ('expired', 'Expired'),
    )
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    interview = models.ForeignKey(Interview, on_delete=models.CASCADE, related_name='invitations')
    candidate_email = models.EmailField()
    candidate = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='interview_invitations')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    attempts_used = models.IntegerField(default=0)
    invitation_token = models.CharField(max_length=255, unique=True)
    expires_at = models.DateTimeField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ('interview', 'candidate_email')
    
    def __str__(self):
        return f"Invitation for {self.candidate_email} to {self.interview.title}"

class Feedback(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    interview = models.ForeignKey(Interview, on_delete=models.CASCADE, related_name='feedbacks')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='feedbacks')
    invitation = models.ForeignKey(InterviewInvitation, on_delete=models.SET_NULL, null=True, blank=True, related_name='feedbacks')
    total_score = models.IntegerField()
    category_scores = models.JSONField() # Stores list of dicts: {name, score, comment}
    strengths = models.JSONField() # Stores list of strings
    areas_for_improvement = models.JSONField() # Stores list of strings
    final_assessment = models.TextField()
    attempt_number = models.IntegerField(default=1)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Feedback for Interview {self.interview.id} by User {self.user.username}"
