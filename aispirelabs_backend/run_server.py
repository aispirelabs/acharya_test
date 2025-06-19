
#!/usr/bin/env python
import os
import sys
import subprocess

def setup_django():
    """Setup Django application"""
    print("Setting up Django application...")
    
    # Install dependencies
    print("Installing Python dependencies...")
    subprocess.run([sys.executable, "-m", "pip", "install", "-r", "requirements.txt"], check=True)
    
    # Run migrations
    print("Running database migrations...")
    subprocess.run([sys.executable, "manage.py", "makemigrations"], check=True)
    subprocess.run([sys.executable, "manage.py", "migrate"], check=True)
    
    # Create superuser if it doesn't exist
    try:
        subprocess.run([
            sys.executable, "manage.py", "shell", "-c",
            "from django.contrib.auth import get_user_model; "
            "User = get_user_model(); "
            "User.objects.create_superuser('admin@admin.com', 'admin@admin.com', 'admin', name='Admin') "
            "if not User.objects.filter(email='admin@admin.com').exists() else None"
        ], check=True)
        print("Superuser created: admin@admin.com / admin")
    except:
        print("Superuser already exists or creation failed")
    
    print("Django setup complete!")

def run_server():
    """Run Django development server"""
    print("Starting Django development server on 0.0.0.0:5000...")
    subprocess.run([sys.executable, "manage.py", "runserver", "0.0.0.0:5000"])

if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "setup":
        setup_django()
    else:
        run_server()
