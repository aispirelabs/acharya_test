
# Generated migration for HR features

from django.db import migrations, models
import django.db.models.deletion
import uuid


class Migration(migrations.Migration):

    dependencies = [
        ('acharya_ai', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='interview',
            name='title',
            field=models.CharField(blank=True, max_length=255, null=True),
        ),
        migrations.AddField(
            model_name='interview',
            name='job_description',
            field=models.TextField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='interview',
            name='max_attempts',
            field=models.IntegerField(default=1),
        ),
        migrations.AddField(
            model_name='interview',
            name='time_limit',
            field=models.IntegerField(default=60),
        ),
        migrations.AddField(
            model_name='interview',
            name='show_feedback',
            field=models.BooleanField(default=True),
        ),
        migrations.AddField(
            model_name='interview',
            name='candidate_emails',
            field=models.JSONField(blank=True, default=list),
        ),
        migrations.AddField(
            model_name='interview',
            name='resume_template',
            field=models.FileField(blank=True, null=True, upload_to='resumes/'),
        ),
        migrations.AddField(
            model_name='interview',
            name='updated_at',
            field=models.DateTimeField(auto_now=True),
        ),
        migrations.AlterField(
            model_name='interview',
            name='type',
            field=models.CharField(choices=[('technical', 'Technical'), ('behavioral', 'Behavioral'), ('mixed', 'Mixed')], max_length=100),
        ),
        migrations.AlterField(
            model_name='interview',
            name='level',
            field=models.CharField(choices=[('entry', 'Entry Level'), ('mid', 'Mid Level'), ('senior', 'Senior Level'), ('lead', 'Lead Level')], max_length=100),
        ),
        migrations.CreateModel(
            name='InterviewInvitation',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('candidate_email', models.EmailField(max_length=254)),
                ('status', models.CharField(choices=[('pending', 'Pending'), ('accepted', 'Accepted'), ('completed', 'Completed'), ('expired', 'Expired')], default='pending', max_length=20)),
                ('attempts_used', models.IntegerField(default=0)),
                ('invitation_token', models.CharField(max_length=255, unique=True)),
                ('expires_at', models.DateTimeField()),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('candidate', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='interview_invitations', to='users.user')),
                ('interview', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='invitations', to='acharya_ai.interview')),
            ],
            options={
                'unique_together': {('interview', 'candidate_email')},
            },
        ),
        migrations.AddField(
            model_name='feedback',
            name='invitation',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='feedbacks', to='acharya_ai.interviewinvitation'),
        ),
        migrations.AddField(
            model_name='feedback',
            name='attempt_number',
            field=models.IntegerField(default=1),
        ),
    ]
