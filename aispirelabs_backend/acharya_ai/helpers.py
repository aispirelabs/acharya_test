import random
import os
import google.generativeai as genai
from django.conf import settings
from google import genai
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv()

class InterviewQuestion(BaseModel):
    questions: list[str] 

class CategoryScore(BaseModel):
    name: str
    score: int
    comment: str

class FeedbackResponse(BaseModel):
    totalScore: int
    categoryScores: list[CategoryScore]
    strengths: list[str]
    areasForImprovement: list[str]
    finalAssessment: str

# Configure the Gemini API key
try:
    if os.getenv('GEMINI_API_KEY'):
        client = genai.Client(api_key=os.getenv('GEMINI_API_KEY'))
    else:
        print("WARN: GEMINI_API_KEY not found in settings or environment variables.")
except Exception as e:
    print(f"Error configuring Gemini: {e}")


def get_random_interview_cover():
    covers = [
        "/covers/adobe.png", "/covers/amazon.png", "/covers/apple.png",
        "/covers/google.png", "/covers/microsoft.png", "/covers/netflix.png",
        "/covers/facebook.png", "/covers/tesla.png", "/covers/default.png"
    ]
    return random.choice(covers) if covers else "/covers/default.png"

def generate_interview_questions_ai(role, level, techstack, type, max_questions):
    """
    Generate interview questions using Gemini AI based on role, level, tech stack, and type.
    """
    print(f"AI: Generating questions for role={role}, level={level}, techstack={techstack}, type={type}, max_questions={max_questions}")

    try:
        model = os.getenv('GEMINI_MODEL', 'gemini-1.5-flash')
        prompt = f"""Generate {max_questions} interview questions for a {level} level {role} position.

Job Details:
- Role: {role}
- Experience Level: {level}
- Tech Stack: {', '.join(techstack)}
- Interview Type: {type}

Requirements:
1. Questions should be appropriate for {level} level candidates
2. Focus should lean towards {type} questions
3. Include relevant technical questions for the tech stack: {', '.join(techstack)}
4. Questions should be clear and professional
5. Avoid special characters that might break voice assistants
6. Return exactly {max_questions} questions

Return the questions as a JSON array of strings."""

        response = client.models.generate_content(
            model=model, 
            contents=prompt, 
            config={
                "response_mime_type": "application/json",
                "response_schema": InterviewQuestion
            }
        )
        
        import json
        questions = json.loads(response.text)
        return questions['questions']
        
    except Exception as e:
        print(f"Error during Gemini AI call for questions: {e}")
        # Return fallback questions
        fallback_questions = [
            f"Tell me about your experience with {role} roles.",
            f"How would you approach a challenging {type} problem?",
            f"What interests you most about working with {', '.join(techstack[:2])}?",
            "Describe a project you're particularly proud of.",
            "How do you stay updated with the latest technologies?"
        ]
        return fallback_questions[:int(max_questions)]


def generate_feedback_ai(transcript, interview_role="N/A"):
    """
    Generate comprehensive interview feedback using Gemini AI based on the interview transcript.
    """
    print(f"AI: Generating feedback for interview role: {interview_role}")

    if not transcript or len(transcript) == 0:
        return {
            "totalScore": 0,
            "categoryScores": [
                {"name": "Communication Skills", "score": 0, "comment": "No transcript available for evaluation."},
                {"name": "Technical Knowledge", "score": 0, "comment": "No transcript available for evaluation."},
                {"name": "Problem-Solving", "score": 0, "comment": "No transcript available for evaluation."},
                {"name": "Cultural & Role Fit", "score": 0, "comment": "No transcript available for evaluation."},
                {"name": "Confidence & Clarity", "score": 0, "comment": "No transcript available for evaluation."}
            ],
            "strengths": ["Unable to evaluate due to missing transcript"],
            "areasForImprovement": ["Complete the interview to receive feedback"],
            "finalAssessment": "No interview data available for assessment.",
        }

    # Format transcript for analysis
    formatted_transcript = "\n".join([
        f"{'Interviewer' if item['role'] == 'interviewer' else 'Candidate'}: {item['content']}" 
        for item in transcript
    ])

    try:
        model = os.getenv('GEMINI_MODEL', 'gemini-1.5-flash')
        
        prompt = f"""You are an expert interview evaluator analyzing a job interview for the role of {interview_role}.

Please analyze the following interview transcript and provide comprehensive feedback:

INTERVIEW TRANSCRIPT:
{formatted_transcript}

EVALUATION CRITERIA:
Evaluate the candidate on a scale of 0-100 in each category:

1. Communication Skills (0-100)
   - Clarity of expression
   - Listening skills
   - Professional communication
   - Ability to articulate thoughts

2. Technical Knowledge (0-100)
   - Understanding of relevant technologies
   - Problem-solving approach
   - Technical depth and accuracy
   - Industry knowledge

3. Problem-Solving (0-100)
   - Analytical thinking
   - Approach to challenges
   - Creativity in solutions
   - Logical reasoning

4. Cultural & Role Fit (0-100)
   - Alignment with role requirements
   - Professional attitude
   - Team collaboration potential
   - Company culture fit

5. Confidence & Clarity (0-100)
   - Self-assurance in responses
   - Clear and concise answers
   - Handling of difficult questions
   - Overall presentation

FEEDBACK REQUIREMENTS:
- Provide specific, actionable feedback
- Highlight both strengths and areas for improvement
- Give an overall assessment with recommendations
- Be constructive and professional
- Base scores on actual performance demonstrated in the transcript

Return your evaluation as a JSON object with the exact structure specified."""

        response = client.models.generate_content(
            model=model, 
            contents=prompt, 
            config={
                "response_mime_type": "application/json",
                "response_schema": FeedbackResponse
            }
        )
        
        import json
        feedback_data = json.loads(response.text)
        
        # Validate required fields
        required_fields = ["totalScore", "categoryScores", "strengths", "areasForImprovement", "finalAssessment"]
        if not all(k in feedback_data for k in required_fields):
            raise ValueError("AI response missing required fields.")
            
        return feedback_data
        
    except Exception as e:
        print(f"Error during Gemini AI call for feedback: {e}")
        
        # Return a basic feedback structure with error handling
        return {
            "totalScore": 50,
            "categoryScores": [
                {"name": "Communication Skills", "score": 50, "comment": "Unable to fully evaluate due to processing error."},
                {"name": "Technical Knowledge", "score": 50, "comment": "Unable to fully evaluate due to processing error."},
                {"name": "Problem-Solving", "score": 50, "comment": "Unable to fully evaluate due to processing error."},
                {"name": "Cultural & Role Fit", "score": 50, "comment": "Unable to fully evaluate due to processing error."},
                {"name": "Confidence & Clarity", "score": 50, "comment": "Unable to fully evaluate due to processing error."}
            ],
            "strengths": ["Participated in the interview process"],
            "areasForImprovement": ["Technical evaluation could not be completed due to system error"],
            "finalAssessment": f"The interview evaluation encountered a technical issue. Please contact support for manual review. Error: {str(e)[:100]}",
        }