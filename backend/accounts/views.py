"""
API views for authentication: register, login, and profile.
"""

from rest_framework import status
from rest_framework.generics import CreateAPIView, RetrieveAPIView
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from .models import User
from .serializers import RegisterSerializer, LoginSerializer, UserSerializer


def get_tokens_for_user(user):
    """Generate JWT access and refresh tokens for a user."""
    refresh = RefreshToken.for_user(user)
    return {
        'refresh': str(refresh),
        'access': str(refresh.access_token),
    }


class RegisterView(CreateAPIView):
    """
    POST /api/auth/register/
    Register a new user and return JWT tokens.
    """

    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        tokens = get_tokens_for_user(user)

        return Response(
            {
                'message': 'Account created successfully!',
                'welcome_message': f'Welcome to our platform, {user.full_name}!',
                'tokens': tokens,
                'user': {
                    'id': user.id,
                    'full_name': user.full_name,
                    'email': user.email,
                    'role': user.role,
                },
            },
            status=status.HTTP_201_CREATED,
        )


class LoginView(APIView):
    """
    POST /api/auth/login/
    Authenticate user and return JWT tokens.
    """

    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data['user']
        tokens = get_tokens_for_user(user)

        return Response(
            {
                'message': 'Login successful!',
                'welcome_message': f'Welcome back, {user.full_name}!',
                'tokens': tokens,
                'user': {
                    'id': user.id,
                    'full_name': user.full_name,
                    'email': user.email,
                    'role': user.role,
                },
            },
            status=status.HTTP_200_OK,
        )


class ProfileView(RetrieveAPIView):
    """
    GET /api/auth/profile/
    Return the authenticated user's profile.
    """

    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user
