from django.urls import path
from .views import RegisterView, LoginView, LogoutView, ScoreView, UserDetailView, LeaderboardView
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

urlpatterns = [
    path("register/", RegisterView.as_view(), name="register"),
    path("login/", LoginView.as_view(), name="login"),
    path("logout/", LogoutView.as_view(), name="logout"),
    path("score/", ScoreView.as_view(), name="score"),
    path("user/", UserDetailView.as_view(), name="user-detail"),
    path("leaderboard/", LeaderboardView.as_view(), name="leaderboard"),

    path('token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
]
