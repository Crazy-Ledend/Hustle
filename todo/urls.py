from django.urls import path
from django.contrib.auth import views as auth_views
from . import views

urlpatterns = [
    path("", views.index, name="index"),
    path("run/", views.run_code, name="run_code"),
    path("logs/", views.task_logs, name="logs"),
    path("complete/<int:task_id>/", views.toggle_task, name="complete_task"),
    path("delete/<int:task_id>/", views.delete_task, name="delete-task"),
    path("login/", auth_views.LoginView.as_view(
        template_name="login.html"
    ), name="login"),
    path("logout/", auth_views.LogoutView.as_view(), name="logout"),
]
