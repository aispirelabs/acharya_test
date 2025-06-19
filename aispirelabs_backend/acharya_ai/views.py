from rest_framework import generics, permissions, status
from rest_framework.response import Response
from .models import Interview, Feedback
from .serializers import InterviewSerializer, FeedbackSerializer, CreateInterviewSerializer, CreateFeedbackSerializer
from .helpers import get_random_interview_cover, generate_interview_questions_ai, generate_feedback_ai
from django.shortcuts import get_object_or_404
from users.models import User # Import your custom User model
from django.db.models import F
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
    permission_classes = [permissions.IsAuthenticated] # Or AllowAny if public listing is desired

    def get(self, request, *args, **kwargs):
        user = request.user
        # Example: return interviews for the current user
        # return Interview.objects.filter(user=user).order_by('-created_at')
        # Or, as per original general.action.ts getLatestInterviews (shows others' interviews)
        # and getInterviewsByUserId (shows own interviews)

        # For now, let's implement getInterviewsByUserId behavior
        interviews = Interview.objects.filter(user=user).prefetch_related('feedbacks').order_by('-created_at')
        result=[]
        for interview in interviews:
            interview_dict = model_to_dict(interview)
            interview_dict['id'] = interview.id
            interview_dict['feedbacks'] = list(interview.feedbacks.values('id', 'total_score', 'category_scores', 'strengths', 'areas_for_improvement', 'final_assessment', 'created_at'))
            result.append(interview_dict)

        return Response(result, status=status.HTTP_200_OK)
        # And a general list (excluding own, similar to getLatestInterviews)
        # Note: original logic for getLatestInterviews also had 'finalized == true'
        # return Interview.objects.filter(finalized=True).exclude(user=user).order_by('-created_at')[:20] # Limiting for now


class InterviewDetailView(generics.RetrieveAPIView):
    queryset = Interview.objects.all()
    serializer_class = InterviewSerializer
    permission_classes = [permissions.IsAuthenticated] # Adjust as needed
    def get(self, request, pk):
        interview = Interview.objects.filter(user=request.user, id=pk).values('id', 'role', 'type','level','cover_image', 'techstack','questions', 'created_at').first()
        if interview:
            feedbacks = list(Feedback.objects.filter(interview_id=pk).values(
                'id', 
                'total_score', 
                'category_scores', 
                'strengths', 
                'areas_for_improvement', 
                'final_assessment',
                'created_at'
            ))
            interview['attempts'] = feedbacks 
            return Response(interview, status=status.HTTP_200_OK)
        else:
            return Response(status=status.HTTP_404_NOT_FOUND)

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
            raise serializers.ValidationError("Interview ID not provided in URL.")

        # Original logic: getFeedbackByInterviewId also filters by userId
        # This means a user can only see their own feedback for an interview.
        # If multiple feedbacks per interview are possible from different users, adjust this.
        # For now, assuming a user fetches their feedback for a specific interview.
        # If interview_id is the primary filter:
        return Feedback.objects.filter(interview_id=interview_id, user=self.request.user).order_by('-created_at')
