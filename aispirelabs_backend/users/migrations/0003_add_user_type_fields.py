
# Generated migration for user type fields

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0002_alter_user_photourl'),
    ]

    operations = [
        migrations.AddField(
            model_name='user',
            name='user_type',
            field=models.CharField(choices=[('candidate', 'Candidate'), ('hr', 'HR Professional')], default='candidate', max_length=20),
        ),
        migrations.AddField(
            model_name='user',
            name='company',
            field=models.CharField(blank=True, max_length=255, null=True),
        ),
        migrations.AddField(
            model_name='user',
            name='position',
            field=models.CharField(blank=True, max_length=255, null=True),
        ),
    ]
