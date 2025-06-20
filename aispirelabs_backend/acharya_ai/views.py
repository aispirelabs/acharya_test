
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import Interview, Feedback, InterviewInvitation
from .serializers import (
    InterviewSerializer, FeedbackSerializer, CreateInterviewSerializer, 
    CreateFeedbackSerializer, InterviewInvitationSerializer
)
from .helpers import get_random_interview_cover, generate_interview_questions_ai, generate_feedback_ai
from django.shortcuts import get_object_or_404
from users.models import User
from django.db.models import F, Count, Avg
from django.forms import model_to_dict
from django.utils import timezone
from datetime import timedelta
import secrets


class InterviewCreateView(generics.CreateAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = CreateInterviewSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

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
            title=data.get('title', f"{data['role']} Interview"),
            role=data['role'],
            type=data['type'],
            level=data['level'],
            techstack=data['techstack'],
            job_description=data.get('job_description', ''),
            questions=questions,
            max_attempts=data.get('max_attempts', 1),
            time_limit=data.get('time_limit', 60),
            show_feedback=data.get('show_feedback', True),
            candidate_emails=data.get('candidate_emails', []),
            cover_image=get_random_interview_cover(),
            finalized=True
        )

        # Create invitations for HR users
        if request.user.user_type == 'hr' and data.get('candidate_emails'):
            for email in data['candidate_emails']:
                invitation_token = secrets.token_urlsafe(32)
                expires_at = timezone.now() + timedelta(days=30)

                InterviewInvitation.objects.create(
                    interview=interview,
                    candidate_email=email,
                    invitation_token=invitation_token,
                    expires_at=expires_at
                )

        output_serializer = InterviewSerializer(interview)
        return Response(output_serializer.data, status=status.HTTP_201_CREATED)


class InterviewListView(generics.ListAPIView):
    serializer_class = InterviewSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, *args, **kwargs):
        user = request.user
        interviews = Interview.objects.filter(user=user).prefetch_related('feedbacks').order_by('-created_at')
        result = []
        for interview in interviews:
            interview_dict = model_to_dict(interview)
            interview_dict['id'] = interview.id
            interview_dict['feedbacks'] = list(interview.feedbacks.values(
                'id', 'total_score', 'category_scores', 'strengths', 
                'areas_for_improvement', 'final_assessment', 'created_at'
            ))
            result.append(interview_dict)

        return Response(result, status=status.HTTP_200_OK)


class InterviewDetailView(generics.RetrieveAPIView):
    queryset = Interview.objects.all()
    serializer_class = InterviewSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, pk):
        interview = Interview.objects.filter(user=request.user, id=pk).values(
            'id', 'role', 'type', 'level', 'cover_image', 'techstack', 'questions', 'created_at'
        ).first()
        
        if interview:
            feedbacks = list(Feedback.objects.filter(interview_id=pk).values(
                'id', 'total_score', 'category_scores', 'strengths', 
                'areas_for_improvement', 'final_assessment', 'created_at'
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

        ai_feedback_data = generate_feedback_ai(data['transcript'], interview_role=interview.role)

        feedback = Feedback.objects.create(
            interview=interview,
            user=request.user,
            total_score=ai_feedback_data.get('totalScore', 0),
            category_scores=ai_feedback_data.get('categoryScores', []),
            strengths=ai_feedback_data.get('strengths', []),
            areas_for_improvement=ai_feedback_data.get('areasForImprovement', []),
            final_assessment=ai_feedback_data.get('finalAssessment', 'Error or no assessment.')
        )
        
        output_serializer = FeedbackSerializer(feedback)
        return Response(output_serializer.data, status=status.HTTP_201_CREATED)


class FeedbackListView(generics.ListAPIView):
    serializer_class = FeedbackSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        interview_id = self.kwargs.get('interview_id')
        if not interview_id:
            return Feedback.objects.none()

        return Feedback.objects.filter(
            interview_id=interview_id, 
            user=self.request.user
        ).order_by('-created_at')


class HRAnalyticsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        if request.user.user_type != 'hr':
            return Response({'error': 'Access denied'}, status=status.HTTP_403_FORBIDDEN)

        # Get interviews created by this HR user
        hr_interviews = Interview.objects.filter(user=request.user)

        # Calculate analytics
        total_interviews = hr_interviews.count()
        total_candidates = InterviewInvitation.objects.filter(interview__user=request.user).count()
        completed_interviews = InterviewInvitation.objects.filter(
            interview__user=request.user, 
            status='completed'
        ).count()

        # Calculate average score
        feedbacks = Feedback.objects.filter(interview__user=request.user)
        average_score = feedbacks.aggregate(avg_score=Avg('total_score'))['avg_score'] or 0

        # Calculate completion rate
        completion_rate = (completed_interviews / total_candidates * 100) if total_candidates > 0 else 0

        # Active interviews
        active_interviews = hr_interviews.filter(
            invitations__status__in=['pending', 'accepted']
        ).distinct().count()

        # Monthly growth
        current_month = timezone.now().replace(day=1)
        current_month_count = hr_interviews.filter(created_at__gte=current_month).count()
        previous_month = current_month - timedelta(days=1)
        previous_month_start = previous_month.replace(day=1)
        previous_month_count = hr_interviews.filter(
            created_at__gte=previous_month_start,
            created_at__lt=current_month
        ).count()

        if previous_month_count > 0:
            monthly_growth = ((current_month_count - previous_month_count) / previous_month_count) * 100
        else:
            monthly_growth = 100 if current_month_count > 0 else 0

        # Recent interviews
        recent_interviews = hr_interviews.order_by('-created_at')[:5]

        # Popular roles
        popular_roles = (
            hr_interviews.values('role')
            .annotate(count=Count('role'))
            .order_by('-count')[:5]
        )

        return Response({
            'total_interviews': total_interviews,
            'total_candidates': total_candidates,
            'completed_interviews': completed_interviews,
            'average_score': round(average_score, 2),
            'completion_rate': round(completion_rate, 2),
            'active_interviews': active_interviews,
            'monthly_growth': round(monthly_growth, 2),
            'recent_interviews': InterviewSerializer(recent_interviews, many=True).data,
            'popular_roles': list(popular_roles),
        })


class HRInterviewsListView(generics.ListAPIView):
    serializer_class = InterviewSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        if request.user.user_type != 'hr':
            return Response({'error': 'Access denied'}, status=status.HTTP_403_FORBIDDEN)

        interviews = Interview.objects.filter(user=request.user).order_by('-created_at')
        serializer = InterviewSerializer(interviews, many=True)
        return Response({'results': serializer.data})


class InterviewInvitationsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, interview_id):
        try:
            interview = Interview.objects.get(id=interview_id, user=request.user)
        except Interview.DoesNotExist:
            return Response({'error': 'Interview not found'}, status=status.HTTP_404_NOT_FOUND)

        invitations = InterviewInvitation.objects.filter(interview=interview).order_by('-created_at')
        serializer = InterviewInvitationSerializer(invitations, many=True)
        return Response({'results': serializer.data})


class FeedbackByInterviewView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, interview_id):
        try:
            interview = Interview.objects.get(id=interview_id)

            # Check permissions
            if request.user.user_type == 'hr' and interview.user != request.user:
                return Response({'error': 'Access denied'}, status=status.HTTP_403_FORBIDDEN)
            elif request.user.user_type == 'candidate':
                feedbacks = Feedback.objects.filter(interview=interview, user=request.user)
            else:
                feedbacks = Feedback.objects.filter(interview=interview)

        except Interview.DoesNotExist:
            return Response({'error': 'Interview not found'}, status=status.HTTP_404_NOT_FOUND)

        serializer = FeedbackSerializer(feedbacks.order_by('-created_at'), many=True)
        return Response({'results': serializer.data})


class AcceptInvitationView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, invitation_id):
        try:
            invitation = InterviewInvitation.objects.get(id=invitation_id)

            # Check if invitation is for this user's email
            if invitation.candidate_email != request.user.email:
                return Response({'error': 'Invalid invitation'}, status=status.HTTP_403_FORBIDDEN)

            # Check if invitation is still valid
            if invitation.status != 'pending' or invitation.expires_at < timezone.now():
                return Response({'error': 'Invitation expired or already used'}, status=status.HTTP_400_BAD_REQUEST)

            # Update invitation
            invitation.candidate = request.user
            invitation.status = 'accepted'
            invitation.save()

            serializer = InterviewInvitationSerializer(invitation)
            return Response(serializer.data)

        except InterviewInvitation.DoesNotExist:
            return Response({'error': 'Invitation not found'}, status=status.HTTP_404_NOT_FOUND)


class InvitationByTokenView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request, token):
        try:
            invitation = InterviewInvitation.objects.select_related('interview').get(
                invitation_token=token
            )

            # Check if invitation is still valid
            if invitation.expires_at < timezone.now():
                invitation.status = 'expired'
                invitation.save()

            serializer = InterviewInvitationSerializer(invitation)
            return Response(serializer.data)

        except InterviewInvitation.DoesNotExist:
            return Response({'error': 'Invalid invitation token'}, status=status.HTTP_404_NOT_FOUND)
