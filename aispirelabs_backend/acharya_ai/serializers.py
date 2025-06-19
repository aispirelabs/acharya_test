from rest_framework import serializers
from .models import Interview, Feedback
from users.serializers import UserSerializer # To nest user details if needed

class InterviewSerializer(serializers.ModelSerializer):
    # user = UserSerializer(read_only=True) # Example if you want to show nested user details
    user = serializers.PrimaryKeyRelatedField(read_only=True) # More common: just show user ID
    # If you need to accept userId on create but set it from request.user:
    # userId = serializers.UUIDField(write_only=True) # Assuming user ID is UUID

    class Meta:
        model = Interview
        fields = ['id', 'user', 'role', 'type', 'level', 'techstack', 'questions', 'finalized', 'cover_image', 'created_at']
        read_only_fields = ['id', 'user', 'questions', 'cover_image', 'created_at', 'finalized'] # User is set in view

class FeedbackSerializer(serializers.ModelSerializer):
    # user = UserSerializer(read_only=True)
    # interview = InterviewSerializer(read_only=True) # Could be too verbose, primary keys usually suffice
    user = serializers.PrimaryKeyRelatedField(read_only=True)
    interview = serializers.PrimaryKeyRelatedField(queryset=Interview.objects.all(), write_only=True) # For creating feedback
    interview_id = serializers.UUIDField(source='interview.id', read_only=True)

    class Meta:
        model = Feedback
        fields = ['id', 'interview', 'interview_id', 'user', 'total_score', 'category_scores', 'strengths', 'areas_for_improvement', 'final_assessment', 'created_at']
        read_only_fields = ['id', 'user', 'interview', 'interview_id', 'created_at', 'total_score', 'category_scores', 'strengths', 'areas_for_improvement', 'final_assessment']
        # AI generates score fields, interview ID is for write_only linking

class CreateInterviewSerializer(serializers.Serializer):
    role = serializers.CharField(max_length=255)
    type = serializers.CharField(max_length=100)
    level = serializers.CharField(max_length=100)
    techstack = serializers.ListField(child=serializers.CharField(max_length=50))
    max_questions = serializers.IntegerField(min_value=1, max_value=20)

class TranscriptItemSerializer(serializers.Serializer):
    role = serializers.CharField()
    content = serializers.CharField()

class CreateFeedbackSerializer(serializers.Serializer):
    interview_id = serializers.UUIDField()
    transcript = serializers.ListField(
        child=TranscriptItemSerializer()
    )
