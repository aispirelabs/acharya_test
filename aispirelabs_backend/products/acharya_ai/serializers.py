
from rest_framework import serializers
from core.shared.serializers import BaseSerializer
from .models import Interview, Feedback, InterviewAttempt


class InterviewSerializer(BaseSerializer):
    class Meta:
        model = Interview
        fields = '__all__'
        read_only_fields = ('user', 'created_at', 'updated_at')

    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)


class CreateInterviewSerializer(serializers.ModelSerializer):
    max_questions = serializers.IntegerField(write_only=True)
    
    class Meta:
        model = Interview
        fields = ('role', 'type', 'level', 'techstack', 'max_questions')


class FeedbackSerializer(BaseSerializer):
    interview_id = serializers.CharField(source='interview.id', read_only=True)
    interview_role = serializers.CharField(source='interview.role', read_only=True)
    
    class Meta:
        model = Feedback
        fields = '__all__'
        read_only_fields = ('user', 'created_at', 'updated_at')


class CreateFeedbackSerializer(serializers.ModelSerializer):
    interview_id = serializers.CharField()
    
    class Meta:
        model = Feedback
        fields = ('interview_id', 'transcript')
        
    def validate_interview_id(self, value):
        try:
            interview = Interview.objects.get(id=value, user=self.context['request'].user)
            return interview
        except Interview.DoesNotExist:
            raise serializers.ValidationError("Interview not found")


class InterviewAttemptSerializer(BaseSerializer):
    interview_role = serializers.CharField(source='interview.role', read_only=True)
    
    class Meta:
        model = InterviewAttempt
        fields = '__all__'
        read_only_fields = ('user', 'created_at', 'updated_at')
