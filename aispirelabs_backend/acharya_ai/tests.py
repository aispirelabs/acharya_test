from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase, APIClient
from django.contrib.auth import get_user_model
from acharya_ai.models import Interview, Feedback
from unittest.mock import patch # For mocking AI helper functions

UserModel = get_user_model()

class AcharyaAITests(APITestCase):
    def setUp(self):
        self.user = UserModel.objects.create_user(username='testuser', email='test@example.com', password='password123')
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)

        self.interview_create_url = reverse('interview-create')
        self.interview_list_url = reverse('interview-list')
        self.feedback_create_url = reverse('feedback-create')

        # Data for creating an interview
        self.interview_data = {
            "role": "Software Engineer",
            "type": "Technical",
            "level": "Mid-level",
            "techstack": ["Python", "Django"],
            "max_questions": 5
        }

        # Create a sample interview for feedback tests
        self.sample_interview = Interview.objects.create(
            user=self.user,
            role="Data Scientist",
            type="Technical",
            level="Senior",
            techstack=["Python", "Pandas"],
            questions=["Q1", "Q2"],
            cover_image="/covers/some.png"
        )
        self.feedback_list_url = reverse('feedback-list-for-interview', kwargs={'interview_id': self.sample_interview.id})


    @patch('acharya_ai.views.generate_interview_questions_ai') # Path to the function in the views module
    @patch('acharya_ai.views.get_random_interview_cover')
    def test_create_interview_success(self, mock_get_cover, mock_generate_questions):
        # Configure mocks
        mock_generate_questions.return_value = ["Mocked Question 1", "Mocked Question 2"]
        mock_get_cover.return_value = "/covers/mocked.png"

        response = self.client.post(self.interview_create_url, self.interview_data, format='json')

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Interview.objects.count(), 2) # Including self.sample_interview
        new_interview = Interview.objects.latest('created_at')
        self.assertEqual(new_interview.role, self.interview_data['role'])
        self.assertEqual(new_interview.questions, ["Mocked Question 1", "Mocked Question 2"])
        mock_generate_questions.assert_called_once_with(
            role=self.interview_data['role'],
            level=self.interview_data['level'],
            techstack=self.interview_data['techstack'],
            type=self.interview_data['type'],
            max_questions=self.interview_data['max_questions']
        )
        mock_get_cover.assert_called_once()

    def test_list_interviews(self):
        # self.sample_interview is created in setUp by self.user
        # Create another interview by another user
        other_user = UserModel.objects.create_user(username='otheruser', email='other@example.com', password='password123')
        Interview.objects.create(
            user=other_user, role="Other Role", type="Other", level="Junior",
            techstack=["Java"], questions=["JQ1"], cover_image="/c.png", finalized=True
        )

        response = self.client.get(self.interview_list_url, format='json') # Default: shows others' interviews
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1) # Should only list the 'otheruser' interview
        self.assertEqual(response.data[0]['role'], "Other Role")

        my_interviews_response = self.client.get(self.interview_list_url + "?my_interviews=true", format='json')
        self.assertEqual(my_interviews_response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(my_interviews_response.data), 1)
        self.assertEqual(my_interviews_response.data[0]['id'], str(self.sample_interview.id))


    def test_get_interview_detail(self):
        detail_url = reverse('interview-detail', kwargs={'pk': self.sample_interview.id})
        response = self.client.get(detail_url, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['role'], self.sample_interview.role)

    @patch('acharya_ai.views.generate_feedback_ai')
    def test_create_feedback_success(self, mock_generate_feedback):
        mock_feedback_data = {
            "totalScore": 85,
            "categoryScores": [{"name": "Technical", "score": 85, "comment": "Good"}],
            "strengths": ["Problem solving"],
            "areasForImprovement": ["Communication"],
            "finalAssessment": "Overall good."
        }
        mock_generate_feedback.return_value = mock_feedback_data

        feedback_payload = {
            "interview_id": str(self.sample_interview.id),
            "transcript": [{"role": "user", "content": "Hello"}, {"role": "assistant", "content": "Hi"}]
        }

        response = self.client.post(self.feedback_create_url, feedback_payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(Feedback.objects.filter(interview=self.sample_interview, user=self.user).exists())
        new_feedback = Feedback.objects.latest('created_at')
        self.assertEqual(new_feedback.total_score, mock_feedback_data['totalScore'])
        mock_generate_feedback.assert_called_once_with(
            feedback_payload['transcript'],
            interview_role=self.sample_interview.role
        )

    def test_list_feedback_for_interview(self):
        Feedback.objects.create(
            interview=self.sample_interview,
            user=self.user,
            total_score=70,
            category_scores=[],
            strengths=[],
            areas_for_improvement=[],
            final_assessment="Test feedback"
        )
        response = self.client.get(self.feedback_list_url, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['total_score'], 70)
