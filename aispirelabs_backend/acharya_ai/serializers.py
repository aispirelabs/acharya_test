from rest_framework import serializers
from .models import Interview, Feedback
from users.serializers import UserSerializer # To nest user details if needed

class InterviewSerializer(serializers.ModelSerializer):
    # user = UserSerializer(read_only=True) # Example if you want to show nested user details
    user = serializers.PrimaryKeyRelatedField(read_only=True)
    feedbacks = FeedbackSerializer(many=True, read_only=True)

    class Meta:
        model = Interview
        fields = ['id', 'user', 'role', 'type', 'level', 'techstack', 'questions', 'finalized', 'cover_image', 'created_at', 'feedbacks']
        read_only_fields = ['id', 'user', 'questions', 'cover_image', 'created_at', 'finalized', 'feedbacks']


# --- Feedback Detail Serializers ---
# Simplified User Serializer for Feedback context
class UserFeedbackContextSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserSerializer.Meta.model # Get User model from UserSerializer
        fields = ['id', 'email', 'first_name', 'last_name', 'user_type'] # Include user_type

# Simplified Interview Serializer for Feedback context
class InterviewFeedbackContextSerializer(serializers.ModelSerializer):
    class Meta:
        model = Interview
        fields = ['id', 'role', 'type', 'level', 'is_hr_created', 'show_feedback_to_candidate'] # Include fields relevant for permission checks or display

class FeedbackSerializer(serializers.ModelSerializer): # Renaming to FeedbackDetailSerializer for clarity might be good, but reusing for now
    user = UserFeedbackContextSerializer(read_only=True)
    interview = InterviewFeedbackContextSerializer(read_only=True)
    # interview_id field is removed as 'interview' object will contain the id.
    # For write operations (like CreateFeedbackSerializer), interview_id is still useful.
    # This serializer is now primarily for READ/DETAIL.

    class Meta:
        model = Feedback
        fields = [
            'id', 'user', 'interview',
            'total_score', 'category_scores', 'strengths',
            'areas_for_improvement', 'final_assessment',
            'created_at', 'session_status', # Include session_status
            'questions_log', 'answers_log' # Include logs for detailed review
        ]
        # All fields are essentially read-only when retrieving detailed feedback,
        # as they are populated by the system or AI.
        read_only_fields = fields
        # If this serializer were also used for creation (which it isn't currently for this detail view),
        # 'interview' (as PrimaryKeyRelatedField) would be writeable.
        # The original 'interview = serializers.PrimaryKeyRelatedField(queryset=Interview.objects.all(), write_only=True)'
        # was for a different purpose (likely initial feedback creation before AI processing).
        # For a detail view, we want the nested object.

# The original FeedbackSerializer had `interview` as write_only.
# For `FeedbackDetailView`, we need it to be read_only and nested.
# I'll keep the original `FeedbackSerializer` for `write_only` purposes if `CreateFeedbackSerializer` doesn't cover all cases,
# and create a new `FeedbackDetailSerializer`.
# However, `CreateFeedbackSerializer` is a simple Serializer, not ModelSerializer.
# Let's adjust the existing FeedbackSerializer to be the detailed one,
# and ensure CreateFeedbackSerializer is used for actual creation.
# This means the `feedbacks` field in `InterviewSerializer` will use this detailed one too.
# This might be too much detail for a list of interviews.
#
# Decision: Create a new FeedbackDetailSerializer for clarity and keep InterviewSerializer's feedbacks field using the simpler one if needed.
# For this step, I will modify FeedbackSerializer to be the detailed one.
# If `InterviewSerializer` needs a less detailed feedback summary, that can be addressed separately.
# The current `InterviewSerializer` already uses `FeedbackSerializer(many=True, read_only=True)`.
# So, modifying `FeedbackSerializer` will make it detailed everywhere. This is acceptable for now.

# Re-evaluating: The prompt implies updating or creating.
# The existing FeedbackSerializer is used in InterviewSerializer.
# Making it fully detailed might be too much for interview listings.
# Let's make a new FeedbackDetailSerializer for the FeedbackDetailView.
# And keep the existing FeedbackSerializer for its current uses (e.g. in InterviewSerializer if it's meant to be a summary).
#
# The existing FeedbackSerializer is:
# class FeedbackSerializer(serializers.ModelSerializer):
#     user = serializers.PrimaryKeyRelatedField(read_only=True)
#     interview = serializers.PrimaryKeyRelatedField(queryset=Interview.objects.all(), write_only=True) # For creating feedback
#     interview_id = serializers.UUIDField(source='interview.id', read_only=True)
#     class Meta:
#         model = Feedback
#         fields = ['id', 'interview', 'interview_id', 'user', 'total_score', 'category_scores', 'strengths', 'areas_for_improvement', 'final_assessment', 'created_at']
#         read_only_fields = [...] # All AI fields are read_only
# This is actually fine for outputting most AI fields. It just needs user and interview to be nested for detail view.
# Let's modify it directly but ensure `write_only` for `interview` field is removed for read purposes.

class FeedbackDetailSerializer(serializers.ModelSerializer): # New name for clarity
    user = UserFeedbackContextSerializer(read_only=True)
    interview = InterviewFeedbackContextSerializer(read_only=True)

    class Meta:
        model = Feedback
        fields = [
            'id', 'user', 'interview',
            'total_score', 'category_scores', 'strengths',
            'areas_for_improvement', 'final_assessment',
            'created_at', 'session_status',
            'questions_log', 'answers_log'
        ]
        # For a detail view, all fields are typically read-only as they represent a completed record.
        read_only_fields = fields

# Now, let's ensure the original FeedbackSerializer used in InterviewSerializer is suitable for summary,
# or adjust InterviewSerializer to use this new FeedbackDetailSerializer if full detail is always wanted.
# For now, InterviewSerializer uses 'FeedbackSerializer'. Let's assume that's the one we're defining as detailed.
# The prompt says "Update/Create FeedbackSerializer". I will update the existing one.

# Corrected approach: Update existing FeedbackSerializer for detail,
# CreateFeedbackSerializer handles creation.

class FeedbackSerializer(serializers.ModelSerializer): # Updated for detailed output
    user = UserFeedbackContextSerializer(read_only=True)
    interview = InterviewFeedbackContextSerializer(read_only=True)

    class Meta:
        model = Feedback
        fields = [
            'id', 'user', 'interview',
            'total_score', 'category_scores', 'strengths',
            'areas_for_improvement', 'final_assessment',
            'created_at', 'session_status',
            'questions_log', 'answers_log'
        ]
        # When retrieving Feedback details, all these fields are effectively read-only.
        # The `write_only=True` for `interview` in original was for a different context (creation).
        read_only_fields = [
            'id', 'user', 'interview',
            'total_score', 'category_scores', 'strengths',
            'areas_for_improvement', 'final_assessment',
            'created_at', 'session_status',
            'questions_log', 'answers_log'
        ]

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

# --- HR Specific Serializers ---

class HRInterviewSerializer(serializers.ModelSerializer):
    hr_creator = serializers.PrimaryKeyRelatedField(read_only=True)
    # user = serializers.PrimaryKeyRelatedField(read_only=True) # Candidate user, already in InterviewSerializer
    feedbacks = FeedbackSerializer(many=True, read_only=True)
    candidate_emails = serializers.ListField(
        child=serializers.EmailField(),
        required=False # Allow empty list or not providing it on update
    )

    class Meta:
        model = Interview
        fields = [
            'id', 'role', 'type', 'level', 'techstack', 'questions',
            'created_at', 'finalized', 'cover_image', # Common fields
            'hr_creator', 'is_hr_created', 'candidate_emails',
            'show_feedback_to_candidate', 'attempt_limit', 'user', # HR specific + candidate user
            'feedbacks' # Nested feedbacks
        ]
        read_only_fields = [
            'id', 'hr_creator', 'is_hr_created', 'questions',
            'created_at', 'finalized', 'cover_image', 'feedbacks', 'user' # user (candidate) is read-only here too
        ]
        # `finalized` might be updatable by HR. If so, remove from read_only_fields.
        # `questions` are auto-generated for candidate interviews, HR might want to customize them.
        # For now, keeping them read_only as per original InterviewSerializer structure.

class HRInterviewCreateSerializer(serializers.ModelSerializer):
    # Fields that HR will input when creating an interview
    role = serializers.CharField(required=True)
    type = serializers.CharField(required=True)
    level = serializers.CharField(required=True)
    techstack = serializers.ListField(child=serializers.CharField(), required=False, default=list)
    candidate_emails = serializers.ListField(child=serializers.EmailField(), required=False, default=list)
    show_feedback_to_candidate = serializers.BooleanField(default=True, required=False)
    attempt_limit = serializers.IntegerField(default=1, min_value=1, required=False)
    max_questions = serializers.IntegerField(default=7, min_value=1, max_value=20, required=False) # Added max_questions

    class Meta:
        model = Interview
        fields = [
            'role', 'type', 'level', 'techstack',
            'candidate_emails', 'show_feedback_to_candidate', 'attempt_limit', 'max_questions' # Added max_questions
        ]
        # hr_creator and is_hr_created are set in the view.
        # user (candidate) is not set at this stage by HR directly.
        # questions are typically generated by AI based on other params, or could be another input step.
        # finalized, cover_image are also typically set by system logic post-creation or later.


# --- Serializers for Interview Attempt State and Answer Submission ---

class InterviewAttemptStateSerializer(serializers.Serializer):
    feedback_id = serializers.UUIDField(read_only=True)
    current_question = serializers.CharField(read_only=True, allow_null=True) # Text of the current question
    question_index = serializers.IntegerField(read_only=True) # 0-based index of the current question
    total_questions = serializers.IntegerField(read_only=True) # Total number of questions in this attempt
    session_status = serializers.CharField(read_only=True) # e.g., 'started', 'in_progress', 'completed'

    def create(self, validated_data): # pragma: no cover
        # This serializer is read-only, so create is not applicable
        raise NotImplementedError()

    def update(self, instance, validated_data): # pragma: no cover
        # This serializer is read-only, so update is not applicable
        raise NotImplementedError()

class SubmitAnswerSerializer(serializers.Serializer):
    answer_text = serializers.CharField(required=True, allow_blank=False)
    question_index = serializers.IntegerField(required=True, min_value=0) # To verify sync with current_question_index

    def create(self, validated_data): # pragma: no cover
        # This serializer is for input validation, not for creating model instances directly
        raise NotImplementedError()

    def update(self, instance, validated_data): # pragma: no cover
        # This serializer is for input validation, not for updating model instances directly
        raise NotImplementedError()


class ReportWarningSerializer(serializers.Serializer):
    reason = serializers.CharField(max_length=255, required=False, allow_blank=True)
    details = serializers.JSONField(required=False)

    def create(self, validated_data): # pragma: no cover
        # This serializer is for input validation, not for creating model instances directly
        raise NotImplementedError()

    def update(self, instance, validated_data): # pragma: no cover
        # This serializer is for input validation, not for updating model instances directly
        raise NotImplementedError()
