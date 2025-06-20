from django.contrib import admin
from .models import Interview, Feedback, InterviewInvitation

class InterviewAdmin(admin.ModelAdmin):
    list_display = ('id', 'title', 'role', 'type', 'level', 'user', 'created_at')
    search_fields = ('title', 'role', 'type', 'user__username')
    list_filter = ('type', 'level', 'user__user_type', 'created_at')
    readonly_fields = ('id', 'created_at', 'updated_at')

class InterviewInvitationAdmin(admin.ModelAdmin):
    list_display = ('id', 'interview', 'candidate_email', 'status', 'attempts_used', 'created_at')
    search_fields = ('candidate_email', 'interview__title', 'interview__role')
    list_filter = ('status', 'created_at')
    readonly_fields = ('id', 'invitation_token', 'created_at', 'updated_at')

class FeedbackAdmin(admin.ModelAdmin):
    list_display = ('id', 'interview', 'user', 'total_score', 'attempt_number', 'created_at')
    search_fields = ('interview__title', 'user__username')
    list_filter = ('total_score', 'created_at')
    readonly_fields = ('id', 'created_at')

# Register your models here.
admin.site.register(Interview, InterviewAdmin)
admin.site.register(InterviewInvitation, InterviewInvitationAdmin)
admin.site.register(Feedback, FeedbackAdmin)