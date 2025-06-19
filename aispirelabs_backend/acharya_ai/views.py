from rest_framework import generics, permissions, status
from rest_framework.permissions import IsAuthenticated # Ensure IsAuthenticated is imported
from rest_framework.response import Response
from .models import Interview, Feedback, InterviewWarning # Import InterviewWarning
from .serializers import (
    InterviewSerializer, FeedbackSerializer, CreateInterviewSerializer, CreateFeedbackSerializer,
    HRInterviewSerializer, HRInterviewCreateSerializer,
    InterviewAttemptStateSerializer, SubmitAnswerSerializer, ReportWarningSerializer
)
from .permissions import IsHRUser
from .helpers import (
    get_random_interview_cover,
    generate_interview_questions_ai,
    generate_feedback_ai, # This is for audio transcripts, might be different
    generate_ai_feedback_for_text_attempt # New helper for text Q&A
)
from django.shortcuts import get_object_or_404
from rest_framework.views import APIView
from django.utils import timezone # For timestamps
from django.conf import settings # Import settings
from users.models import User # Import your custom User model
from django.db.models import Q, F # Import Q
from django.forms import model_to_dict

class InterviewCreateView(generics.CreateAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = CreateInterviewSerializer # Use this for input validation

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        print("data", data)
        # AI Question Generation
        questions = generate_interview_questions_ai(
            role=data['role'],
            level=data['level'],
            techstack=data['techstack'],
            type=data['type'],
            max_questions=data['max_questions']
        )

        interview = Interview.objects.create(
            user=request.user,
            role=data['role'],
            type=data['type'],
            level=data['level'],
            techstack=data['techstack'],
            questions=questions,
            cover_image=get_random_interview_cover(),
            finalized=True # As per original logic
        )

        output_serializer = InterviewSerializer(interview)
        return Response(output_serializer.data, status=status.HTTP_201_CREATED)

class InterviewListView(generics.ListAPIView):
    serializer_class = InterviewSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        """
        This view should return a list of all the interviews
        for the currently authenticated user.
        """
        user = self.request.user
        # The prefetch_related for feedbacks can be handled by the serializer if needed,
        # or kept here if performance dictates. For standard ListAPIView,
        # the serializer handles representation.
        return Interview.objects.filter(user=user).order_by('-created_at')


class InterviewDetailView(generics.RetrieveAPIView): # Changed from RetrieveAPIView to RetrieveUpdateDestroyAPIView if needed later, for now Retrieve is fine.
    serializer_class = InterviewSerializer # This serializer will handle representation including feedbacks if configured.
    permission_classes = [permissions.IsAuthenticated]
    lookup_field = 'id' # Assuming URL uses 'id' as pk, or 'pk' if that's the case. The URL pattern will define this.

    def get_queryset(self):
        """
        This view should return an interview instance if the user is the owner.
        """
        user = self.request.user
        # No need to manually select fields here, serializer will handle it.
        # Prefetching feedbacks can be done here or in serializer for optimization.
        return Interview.objects.filter(user=user).prefetch_related('feedbacks')

    # If you need to add feedbacks to the response manually (like original code did with 'attempts')
    # you can override retrieve method or customize serializer.
    # For simplicity, let's assume InterviewSerializer can be adjusted or already handles this.
    # If InterviewSerializer doesn't include feedbacks, and you want the exact same 'attempts' structure:
    # def retrieve(self, request, *args, **kwargs):
    #     instance = self.get_object()
    #     serializer = self.get_serializer(instance)
    #     data = serializer.data
    #     # Manually add feedbacks if serializer doesn't do it and structure is specific
    #     feedbacks = list(Feedback.objects.filter(interview_id=instance.id).values(
    #         'id', 'total_score', 'category_scores', 'strengths',
    #         'areas_for_improvement', 'final_assessment', 'created_at'
    #     ))
    #     data['attempts'] = feedbacks
    #     return Response(data)

# Note: The original InterviewDetailView used `pk` in `def get(self, request, pk):`.
# If the URL is defined with `<uuid:pk>`, then `lookup_field` should be 'pk'.
# If URL is `<uuid:id>`, then `lookup_field` should be 'id'.
# The provided example uses `lookup_field = 'pk'`, I'll assume the URL has `pk`.
# The current `Interview` model uses `id` as primary key. So `lookup_field = 'id'` is more appropriate.
# Let's adjust `lookup_field` to 'id' which is the actual field name in the model.
# And in `InterviewDetailView`'s `get_queryset`, we don't need `values(...)` if using serializer.
# The `get` method in `InterviewDetailView` was trying to filter by `id=pk`. If the URL conf uses `id` then it's fine.
# Let's assume the URL for detail view is /interviews/{id}/

class InterviewDetailView(generics.RetrieveAPIView):
    serializer_class = InterviewSerializer
    permission_classes = [permissions.IsAuthenticated]
    lookup_field = 'id'

    def get_queryset(self):
        user = self.request.user
        return Interview.objects.filter(user=user).prefetch_related('feedbacks')

    # The original `get` method in InterviewDetailView had a custom structure for 'attempts'.
    # To replicate this while using DRF's generic views, we can override `retrieve` or customize the serializer.
    # For now, let's assume InterviewSerializer is or will be responsible for including feedbacks.
    # If not, overriding `retrieve` is the way:
    # def retrieve(self, request, *args, **kwargs):
    #     instance = self.get_object()
    #     serializer = self.get_serializer(instance)
    #     data = serializer.data
    #     # Manually add feedbacks if serializer doesn't do it and structure is specific
    #     feedbacks_data = list(instance.feedbacks.all().values(
    #         'id', 'total_score', 'category_scores', 'strengths',
    #         'areas_for_improvement', 'final_assessment', 'created_at'
    #     ))
    #     data['attempts'] = feedbacks_data # Or use a FeedbackSerializer for this
    #     return Response(data)

class FeedbackCreateView(generics.CreateAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = CreateFeedbackSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        interview = get_object_or_404(Interview, id=data['interview_id'])

        # Check if this user is allowed to submit feedback for this interview
        # (e.g., if they took it, or if it's their own interview they are testing)
        # For now, we assume the authenticated user is the one providing feedback for an interview they participated in.
        # The original logic implies userId is passed with feedback, linking it to the user who GAVE the feedback.

        ai_feedback_data = generate_feedback_ai(data['transcript'], interview_role=interview.role)

        feedback = Feedback.objects.create(
            interview=interview,
            user=request.user, # The user submitting the feedback
            total_score=ai_feedback_data.get('totalScore', 0),
            category_scores=ai_feedback_data.get('categoryScores', []),
            strengths=ai_feedback_data.get('strengths', []),
            areas_for_improvement=ai_feedback_data.get('areasForImprovement', []),
            final_assessment=ai_feedback_data.get('finalAssessment', 'Error or no assessment.')
        )
        output_serializer = FeedbackSerializer(feedback)
        return Response(output_serializer.data, status=status.HTTP_201_CREATED)

class FeedbackListView(generics.ListAPIView): # List feedback for a specific interview
    serializer_class = FeedbackSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        interview_id = self.kwargs.get('interview_id') # Assuming URL passes interview_id
        if not interview_id:
            # Or handle as an error: return Feedback.objects.none()
            from rest_framework import serializers # Local import for ValidationError
            raise serializers.ValidationError("Interview ID not provided in URL.")

        # Original logic: getFeedbackByInterviewId also filters by userId
        # This means a user can only see their own feedback for an interview.
        # If multiple feedbacks per interview are possible from different users, adjust this.
        # For now, assuming a user fetches their feedback for a specific interview.
        # If interview_id is the primary filter:
        return Feedback.objects.filter(interview_id=interview_id, user=self.request.user).order_by('-created_at')

# --- HR Specific Views ---

class HRInterviewListView(generics.ListAPIView):
    serializer_class = HRInterviewSerializer
    permission_classes = [IsAuthenticated, IsHRUser]

    def get_queryset(self):
        return Interview.objects.filter(
            hr_creator=self.request.user,
            is_hr_created=True
        ).order_by('-created_at').prefetch_related('feedbacks')

class HRInterviewCreateView(generics.CreateAPIView):
    serializer_class = HRInterviewCreateSerializer
    permission_classes = [IsAuthenticated, IsHRUser]

    def perform_create(self, serializer):
        # Generate questions similar to candidate's InterviewCreateView
        # The validated_data comes from HRInterviewCreateSerializer
        validated_data = serializer.validated_data
        questions = generate_interview_questions_ai(
            role=validated_data['role'],
            level=validated_data['level'],
            techstack=validated_data.get('techstack', []), # Use .get for optional fields
            type=validated_data['type'],
            max_questions=validated_data.get('max_questions', 7) # Use .get with default
        )

        # Note: `user` (candidate) is not set here. It's null by default as per model change.
        # `candidate_emails` are saved directly by serializer.save()
        serializer.save(
            hr_creator=self.request.user,
            is_hr_created=True,
            questions=questions, # Save the generated questions
            cover_image=get_random_interview_cover(), # Add a cover image
            finalized=True # Or based on HR input if added to serializer
        )

    # Override create to return the full HRInterviewSerializer data, not just HRInterviewCreateSerializer
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer) # This saves the instance
        # Use HRInterviewSerializer for the response to include all fields
        response_serializer = HRInterviewSerializer(serializer.instance)
        headers = self.get_success_headers(response_serializer.data)
        return Response(response_serializer.data, status=status.HTTP_201_CREATED, headers=headers)


class HRInterviewDetailView(generics.RetrieveUpdateAPIView):
    serializer_class = HRInterviewSerializer
    permission_classes = [IsAuthenticated, IsHRUser]
    lookup_field = 'id'

    def get_queryset(self):
        return Interview.objects.filter(
            hr_creator=self.request.user,
            is_hr_created=True
        ).prefetch_related('feedbacks')

    # If specific fields should not be updatable by HR after creation (e.g. role, type, level),
    # a separate serializer for PATCH/PUT might be needed, or logic in update() method.
    # For now, HRInterviewSerializer controls what's updatable (all non-read_only fields).


# --- Views for Candidate Interview Taking Flow ---

class StartInterviewAttemptView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, interview_id):
        interview = get_object_or_404(Interview, id=interview_id)
        user = request.user

        # Check existing feedback for this user and interview to see if it was terminated
        # This is a simplified check. A more robust system might allow resuming 'in_progress' sessions
        # or handle multiple feedback objects per user per interview differently.
        existing_feedback = Feedback.objects.filter(interview=interview, user=user).order_by('-created_at').first()
        if existing_feedback and existing_feedback.session_status == 'terminated':
            return Response({
                'error': 'This interview session was previously terminated due to excessive warnings.',
                'session_status': 'terminated' # Ensure frontend knows
            }, status=status.HTTP_403_FORBIDDEN)

        # Authorization: Check if user can attempt this interview
        if interview.is_hr_created:
            if user.email not in interview.candidate_emails:
                return Response({'error': 'You are not invited to this interview.'}, status=status.HTTP_403_FORBIDDEN)

            # Check attempt limit
            existing_attempts_count = Feedback.objects.filter(interview=interview, user=user).count()
            if existing_attempts_count >= interview.attempt_limit:
                return Response({'error': f'You have reached the maximum attempt limit ({interview.attempt_limit}) for this interview.'}, status=status.HTTP_403_FORBIDDEN)
        else: # Candidate-created interview
            if interview.user != user:
                return Response({'error': 'You are not authorized to start this interview.'}, status=status.HTTP_403_FORBIDDEN)
            # Optionally, check attempt limit for candidate's own interviews if different from 1 by default (e.g. if they can re-practice)
            # For now, assuming candidate's own interviews also adhere to attempt_limit if it's set > 1, or default 1.
            existing_attempts_count = Feedback.objects.filter(interview=interview, user=user).count()
            if existing_attempts_count >= interview.attempt_limit and interview.attempt_limit > 0 : # if attempt_limit is 0, means unlimited
                 return Response({'error': f'You have reached the maximum attempt limit ({interview.attempt_limit}) for this interview.'}, status=status.HTTP_403_FORBIDDEN)


        # Ensure interview has questions
        if not interview.questions:
            # This ideally should be populated when HR creates interview or candidate finalizes their own.
            # If it's a candidate interview, they might not have max_questions set in the same way.
            # For now, let's assume CreateInterviewSerializer for candidates ensures questions are made.
            # If HR created, HRInterviewCreateView now generates questions.
             return Response({'error': 'Interview questions are not ready for this session.'}, status=status.HTTP_400_BAD_REQUEST)


        questions_for_log = [{'text': q_text, 'timestamp': timezone.now().isoformat()} for q_text in interview.questions]

        feedback = Feedback.objects.create(
            interview=interview,
            user=user,
            session_status='started',
            current_question_index=0,
            questions_log=questions_for_log,
            # Other fields like total_score, etc., will be populated later
        )

        first_question_text = interview.questions[0] if interview.questions else None

        current_state_data = {
            'feedback_id': feedback.id,
            'current_question': first_question_text,
            'question_index': 0,
            'total_questions': len(interview.questions),
            'session_status': feedback.session_status,
        }
        state_serializer = InterviewAttemptStateSerializer(current_state_data)
        return Response(state_serializer.data, status=status.HTTP_201_CREATED)


class SubmitAnswerView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, feedback_id):
        feedback = get_object_or_404(Feedback, id=feedback_id, user=request.user)

        # Check if session is already terminated due to warnings
        if feedback.session_status == 'terminated':
            state_data = {
                'feedback_id': feedback.id,
                'current_question': None,
                'question_index': feedback.current_question_index,
                'total_questions': len(feedback.questions_log),
                'session_status': 'terminated',
            }
            serializer = InterviewAttemptStateSerializer(state_data)
            return Response(serializer.data, status=status.HTTP_403_FORBIDDEN) # Or 200 OK if frontend handles terminated state gracefully

        serializer = SubmitAnswerSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        validated_data = serializer.validated_data
        answer_text = validated_data['answer_text']
        question_index_from_request = validated_data['question_index']


        if feedback.session_status not in ['started', 'in_progress']:
            return Response({'error': f'Cannot submit answer. Interview session is {feedback.session_status}.'}, status=status.HTTP_400_BAD_REQUEST)

        if question_index_from_request != feedback.current_question_index:
            return Response({'error': 'Submitted answer is for the wrong question index. Sync issue?'}, status=status.HTTP_409_CONFLICT)

        if feedback.current_question_index >= len(feedback.questions_log):
            return Response({'error': 'All questions have already been answered.'}, status=status.HTTP_400_BAD_REQUEST)

        current_question_logged = feedback.questions_log[feedback.current_question_index]

        feedback.answers_log.append({
            'question_text': current_question_logged['text'], # Log the actual question text
            'answer_text': answer_text,
            'timestamp': timezone.now().isoformat()
        })

        feedback.current_question_index += 1
        next_question_text = None

        if feedback.current_question_index >= len(feedback.questions_log):
            feedback.session_status = 'completed'
            # Generate and save AI feedback
            try:
                ai_feedback_data = generate_ai_feedback_for_text_attempt(feedback)
                if ai_feedback_data:
                    feedback.total_score = ai_feedback_data.get('total_score')
                    feedback.category_scores = ai_feedback_data.get('category_scores', [])
                    feedback.strengths = ai_feedback_data.get('strengths', [])
                    feedback.areas_for_improvement = ai_feedback_data.get('areas_for_improvement', [])
                    feedback.final_assessment = ai_feedback_data.get('final_assessment')
                else:
                    # Log if AI feedback generation returns None (error or unexpected)
                    print(f"Warning: AI feedback generation returned None for Feedback ID {feedback.id}")
            except Exception as e:
                # Log the exception from AI feedback generation
                print(f"Error during AI feedback generation for Feedback ID {feedback.id}: {e}")
                # Optionally, save a default error message in final_assessment
                feedback.final_assessment = "Error generating AI feedback for this session."

        else:
            feedback.session_status = 'in_progress'
            next_question_text = feedback.questions_log[feedback.current_question_index]['text']

        feedback.save()

        state_data = {
            'feedback_id': feedback.id,
            'current_question': next_question_text,
            'question_index': feedback.current_question_index,
            'total_questions': len(feedback.questions_log),
            'session_status': feedback.session_status,
        }
        serializer = InterviewAttemptStateSerializer(state_data)
        return Response(serializer.data, status=status.HTTP_200_OK)


class ReportInterviewWarningView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, feedback_id):
        feedback_attempt = get_object_or_404(Feedback, id=feedback_id, user=request.user)

        if feedback_attempt.session_status not in ['started', 'in_progress']:
            return Response(
                {'error': f'Warnings can only be reported for active interview sessions. Current status: {feedback_attempt.session_status}'},
                status=status.HTTP_400_BAD_REQUEST
            )

        serializer = ReportWarningSerializer(data=request.data)
        serializer.is_valid(raise_exception=True) # Let it raise 400 if data is bad

        warning = InterviewWarning.objects.create(
            feedback_attempt=feedback_attempt,
            reason=serializer.validated_data.get('reason', 'Loss of focus detected'),
            details=serializer.validated_data.get('details')
        )

        warning_count = InterviewWarning.objects.filter(feedback_attempt=feedback_attempt).count()

        response_data = {
            'status': 'warning_logged',
            'warning_id': warning.id,
            'warning_count': warning_count,
            'max_warnings': settings.MAX_INTERVIEW_WARNINGS
        }

        if warning_count >= settings.MAX_INTERVIEW_WARNINGS:
            feedback_attempt.session_status = 'terminated'
            feedback_attempt.save()
            response_data['status'] = 'terminated'
            response_data['message'] = 'Interview terminated due to excessive warnings.'
            return Response(response_data, status=status.HTTP_403_FORBIDDEN) # Or 200 OK if frontend handles termination gracefully via 'status' field

        return Response(response_data, status=status.HTTP_200_OK)


# --- View for Retrieving Detailed Feedback ---

class FeedbackDetailView(generics.RetrieveAPIView):
    serializer_class = FeedbackSerializer # Using the updated detailed FeedbackSerializer
    permission_classes = [IsAuthenticated]
    lookup_field = 'id' # URL will use <uuid:id> for feedback_id

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated: # Should be caught by IsAuthenticated, but good practice
            return Feedback.objects.none()

        # Candidates can see their own feedback, subject to show_feedback_to_candidate rule (handled below or by frontend)
        candidate_q = Q(user=user)

        # HR users can see feedback for interviews they created
        hr_q = Q(interview__hr_creator=user, interview__is_hr_created=True)

        # Combine queries: user can see feedback if they are the subject of it OR if they are the HR who created the interview
        # This doesn't yet implement the show_feedback_to_candidate rule on the backend directly for candidates viewing their own feedback
        # on HR-created interviews. That logic might be better placed in `retrieve` or handled by frontend.
        # For now, this queryset allows access if either condition is met.
        return Feedback.objects.filter(candidate_q | hr_q).distinct().select_related('user', 'interview')

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object() # This applies the get_queryset filtering

        # Additional check for candidates viewing feedback on HR-created interviews
        if instance.interview.is_hr_created and \
           instance.user == request.user and \
           instance.interview.hr_creator != request.user and \
           not instance.interview.show_feedback_to_candidate:
            return Response(
                {'error': 'Feedback is not currently visible for this interview attempt as per HR settings.'},
                status=status.HTTP_403_FORBIDDEN
            )

        serializer = self.get_serializer(instance)
        return Response(serializer.data)
