from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from .models import Profile
from .serializers import RegisterSerializer, UserSerializer, ScoreSerializer


class RegisterView(APIView):
    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response({"message": "User created successfully"}, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class LoginView(APIView):
    def post(self, request):
        username = request.data.get("username")
        password = request.data.get("password")
        user = authenticate(username=username, password=password)

        if user:
            refresh = RefreshToken.for_user(user)
            return Response({
                "access": str(refresh.access_token),
                "refresh": str(refresh),
            })
        return Response({"error": "Invalid credentials"}, status=status.HTTP_400_BAD_REQUEST)

class LogoutView(APIView):
    def post(self, request):
        return Response({"message": "Logout successful"}, status=status.HTTP_200_OK)

class ScoreView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        profile = Profile.objects.get(user=request.user)
        return Response({"high_score": profile.high_score})

    def post(self, request, *args, **kwargs):
        user = request.user
        profile = user.profile
        new_score = request.data.get('score')

        current_high_score = profile.high_score if profile.high_score is not None else 0

        if new_score > current_high_score:
            profile.high_score = new_score
            profile.save()
            return Response({"detail": "High score updated successfully."})

        return Response({"detail": "New score is not higher than the current high score."})

class UserDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response({"id": request.user.id})

class LeaderboardView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        top_players = Profile.objects.select_related("user").order_by("-high_score")[:10]
        data = [
            {"username": player.user.username, "high_score": player.high_score}
            for player in top_players
        ]
        return Response(data, status=status.HTTP_200_OK)
