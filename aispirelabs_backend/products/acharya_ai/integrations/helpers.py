
import random


def get_random_interview_cover():
    """Get a random cover image for interviews"""
    covers = [
        "/covers/adobe.png", "/covers/amazon.png", "/covers/apple.png",
        "/covers/facebook.png", "/covers/google.png", "/covers/microsoft.png",
        "/covers/netflix.png", "/covers/spotify.png", "/covers/twitter.png",
        "/covers/uber.png", "/covers/airbnb.png", "/covers/linkedin.png"
    ]
    return random.choice(covers)


def format_techstack(techstack):
    """Format techstack from string to list"""
    if isinstance(techstack, str):
        return [tech.strip() for tech in techstack.split(',') if tech.strip()]
    return techstack if isinstance(techstack, list) else []


def validate_interview_data(data):
    """Validate interview creation data"""
    required_fields = ['role', 'type', 'level', 'techstack', 'max_questions']
    
    for field in required_fields:
        if field not in data or not data[field]:
            return False, f"{field} is required"
    
    if data['max_questions'] < 1 or data['max_questions'] > 20:
        return False, "max_questions must be between 1 and 20"
    
    return True, "Valid"
