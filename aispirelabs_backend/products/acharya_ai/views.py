
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.shortcuts import get_object_or_404

from .models import Interview, Feedback, InterviewAttempt
from .serializers import (
    InterviewSerializer, 
    CreateInterviewSerializer,
    FeedbackSerializer,
    CreateFeedbackSerializer,
    InterviewAttemptSerializer
)
from .integrations.gemini_service import GeminiService
from .integrations.helpers import get_random_interview_cover, format_techstack, validate_interview_data


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_interview(request):
    """Create a new interview with AI-generated questions"""
    try:
        # Validate input data
        is_valid, message = validate_interview_data(request.data)
        if not is_valid:
            return Response({
                'success': False,
                'error': message
            }, status=status.HTTP_400_BAD_REQUEST)

        # Extract data
        role = request.data.get('role')
        interview_type = request.data.get('type')
        level = request.data.get('level')
        techstack = format_techstack(request.data.get('techstack'))
        max_questions = int(request.data.get('max_questions', 5))

        # Generate questions using Gemini AI
        gemini_service = GeminiService()
        questions = gemini_service.generate_interview_questions(
            role=role,
            level=level,
            techstack=techstack,
            interview_type=interview_type,
            max_questions=max_questions
        )

        # Create interview
        interview = Interview.objects.create(
            user=request.user,
            role=role,
            type=interview_type,
            level=level,
            techstack=techstack,
            questions=questions,
            cover_image=get_random_interview_cover(),
            finalized=True
        )

        serializer = InterviewSerializer(interview)
        return Response({
            'success': True,
            'interview_id': interview.id,
            'interview': serializer.data
        }, status=status.HTTP_201_CREATED)

    except Exception as e:
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_interviews(request):
    """Get all interviews for the current user"""
    interviews = Interview.objects.filter(user=request.user)
    serializer = InterviewSerializer(interviews, many=True)
    return Response({
        'success': True,
        'interviews': serializer.data
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_interview(request, interview_id):
    """Get a specific interview"""
    interview = get_object_or_404(Interview, id=interview_id, user=request.user)
    serializer = InterviewSerializer(interview)
    return Response({
        'success': True,
        'interview': serializer.data
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_feedback(request):
    """Create feedback for an interview"""
    try:
        interview_id = request.data.get('interview_id')
        transcript = request.data.get('transcript', [])

        # Get interview
        interview = get_object_or_404(Interview, id=interview_id, user=request.user)

        # Check if feedback already exists
        if hasattr(interview, 'feedback'):
            return Response({
                'success': False,
                'error': 'Feedback already exists for this interview'
            }, status=status.HTTP_400_BAD_REQUEST)

        # Generate feedback using Gemini AI
        gemini_service = GeminiService()
        feedback_data = gemini_service.analyze_interview_feedback(transcript, interview)

        # Create feedback
        feedback = Feedback.objects.create(
            interview=interview,
            user=request.user,
            transcript=transcript,
            total_score=feedback_data.get('overall_score', 70),
            detailed_feedback=feedback_data
        )

        serializer = FeedbackSerializer(feedback)
        return Response({
            'success': True,
            'feedback_id': feedback.id,
            'feedback': serializer.data
        }, status=status.HTTP_201_CREATED)

    except Exception as e:
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_feedback(request, interview_id):
    """Get feedback for a specific interview"""
    interview = get_object_or_404(Interview, id=interview_id, user=request.user)
    
    try:
        feedback = interview.feedback
        serializer = FeedbackSerializer(feedback)
        return Response({
            'success': True,
            'feedback': serializer.data
        })
    except Feedback.DoesNotExist:
        return Response({
            'success': False,
            'error': 'Feedback not found for this interview'
        }, status=status.HTTP_404_NOT_FOUND)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_interview_attempts(request, interview_id):
    """Get all attempts for a specific interview"""
    interview = get_object_or_404(Interview, id=interview_id, user=request.user)
    attempts = interview.attempts.all()
    serializer = InterviewAttemptSerializer(attempts, many=True)
    return Response({
        'success': True,
        'attempts': serializer.data
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dashboard_stats(request):
    """Get dashboard statistics for the user"""
    user_interviews = Interview.objects.filter(user=request.user)
    user_feedbacks = Feedback.objects.filter(user=request.user)
    
    # Calculate average score
    total_scores = [f.total_score for f in user_feedbacks if f.total_score]
    avg_score = sum(total_scores) / len(total_scores) if total_scores else 0
    
    stats = {
        'total_interviews': user_interviews.count(),
        'completed_interviews': user_feedbacks.count(),
        'average_score': round(avg_score),
        'recent_interviews': InterviewSerializer(
            user_interviews[:5], many=True
        ).data,
        'improvement_trend': 'positive' if avg_score > 70 else 'needs_work'
    }
    
    return Response({
        'success': True,
        'stats': stats
    })
