from django.contrib import admin
from .models import Interview, Feedback

class InterviewAdmin(admin.ModelAdmin):
    list_display = ('id', 'role', 'type', 'techstack', 'created_at')
    search_fields = ('role', 'type', 'techstack')
    list_filter = ('type', 'created_at')

class FeedbackAdmin(admin.ModelAdmin):
    list_display = ('id', 'interview', 'user', 'created_at')
    search_fields = ('interview', 'user')
    list_filter = ('created_at',)

# Register your models here.
admin.site.register(Interview, InterviewAdmin)
admin.site.register(Feedback, FeedbackAdmin)