from django.db import models
from users.models import User # Assuming User model is in 'users' app
import uuid

class Interview(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='interviews')
    role = models.CharField(max_length=255)
    type = models.CharField(max_length=100) # e.g., "behavioural", "technical"
    level = models.CharField(max_length=100) # e.g., "entry", "senior"
    techstack = models.JSONField() # Stores a list of strings
    questions = models.JSONField() # Stores a list of question strings
    finalized = models.BooleanField(default=True)
    cover_image = models.URLField(max_length=255, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Interview for {self.role} ({self.id})"

class Feedback(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    interview = models.ForeignKey(Interview, on_delete=models.CASCADE, related_name='feedbacks')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='feedbacks')
    total_score = models.IntegerField()
    category_scores = models.JSONField() # Stores list of dicts: {name, score, comment}
    strengths = models.JSONField() # Stores list of strings
    areas_for_improvement = models.JSONField() # Stores list of strings
    final_assessment = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Feedback for Interview {self.interview.id} by User {self.user.username}"
