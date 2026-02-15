from django.db import models

class Todo(models.Model):
    user_id = models.IntegerField(default=1)
    title = models.CharField(max_length=255)
    completed = models.BooleanField(default=False)
    reminder_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    completed_at = models.DateTimeField(null=True, blank=True)