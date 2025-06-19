from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase, APIClient
from django.contrib.auth import get_user_model
from users.models import User as CustomUserModel # Assuming this is your user model if get_user_model() is not specific enough

UserModel = get_user_model()

class AuthTests(APITestCase):
    def setUp(self):
        self.register_url = reverse('user_register')
        self.login_url = reverse('token_obtain_pair')
        self.profile_url = reverse('user_profile')

        self.user_data = {
            'username': 'testuser',
            'email': 'test@example.com',
            'password': 'StrongPassword123',
            'first_name': 'Test',
            'last_name': 'User'
        }
        # Create a user for tests that require an authenticated user
        self.user = UserModel.objects.create_user(
            username='existinguser',
            email='existing@example.com',
            password='password123'
        )

    def test_user_registration_success(self):
        response = self.client.post(self.register_url, self.user_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(UserModel.objects.filter(email=self.user_data['email']).exists())

    def test_user_registration_duplicate_email(self):
        # Register first user
        self.client.post(self.register_url, self.user_data, format='json')
        # Attempt to register second user with same email
        duplicate_data = self.user_data.copy()
        duplicate_data['username'] = 'anotheruser'
        response = self.client.post(self.register_url, duplicate_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST) # Assuming email is unique

    def test_user_login_success(self):
        # User is created in setUp
        login_data = {'email': 'existing@example.com', 'password': 'password123'}
        # Note: SimpleJWT's TokenObtainPairView typically uses username or email based on User model's USERNAME_FIELD and authentication backend.
        # If using default User model and email as username field, this should work.
        # If your custom user uses 'email' for login, ensure your TokenObtainPairSerializer is configured for it, or use 'username'.
        # For default AbstractUser, 'username' is the USERNAME_FIELD.
        # Let's try with username:
        login_data_uname = {'username': 'existinguser', 'password': 'password123'}
        response = self.client.post(self.login_url, login_data_uname, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)

    def test_user_login_failure_wrong_password(self):
        login_data = {'username': 'existinguser', 'password': 'wrongpassword'}
        response = self.client.post(self.login_url, login_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_get_user_profile_authenticated(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.get(self.profile_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['email'], self.user.email)

    def test_get_user_profile_unauthenticated(self):
        response = self.client.get(self.profile_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_update_user_profile_authenticated(self):
        self.client.force_authenticate(user=self.user)
        update_data = {'first_name': 'Updated'}
        response = self.client.patch(self.profile_url, update_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.user.refresh_from_db()
        self.assertEqual(self.user.first_name, 'Updated')
