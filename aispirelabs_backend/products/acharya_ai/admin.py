
from django.contrib import admin
from .models import Interview, Feedback, InterviewAttempt


@admin.register(Interview)
class InterviewAdmin(admin.ModelAdmin):
    list_display = ('role', 'type', 'level', 'user', 'finalized', 'created_at')
    list_filter = ('type', 'level', 'finalized', 'created_at')
    search_fields = ('role', 'user__email')
    readonly_fields = ('created_at', 'updated_at')
    
    fieldsets = (
        ('Interview Details', {
            'fields': ('role', 'type', 'level', 'techstack')
        }),
        ('Content', {
            'fields': ('questions', 'cover_image', 'finalized')
        }),
        ('User Info', {
            'fields': ('user',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(Feedback)
class FeedbackAdmin(admin.ModelAdmin):
    list_display = ('interview', 'user', 'total_score', 'created_at')
    list_filter = ('total_score', 'created_at')
    search_fields = ('interview__role', 'user__email')
    readonly_fields = ('created_at', 'updated_at')


@admin.register(InterviewAttempt)
class InterviewAttemptAdmin(admin.ModelAdmin):
    list_display = ('interview', 'user', 'status', 'score', 'created_at')
    list_filter = ('status', 'created_at')
    search_fields = ('interview__role', 'user__email')
    readonly_fields = ('created_at', 'updated_at')
