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
    # Assuming GEMINI_API_KEY is set in Django settings or environment variables
    if os.getenv('GEMINI_API_KEY'):
        client = genai.Client(api_key=os.getenv('GEMINI_API_KEY'))
    else:

        print("WARN: GEMINI_API_KEY not found in settings or environment variables.")
except Exception as e:
    print(f"Error configuring Gemini: {e}")


def get_random_interview_cover():
    # Placeholder - adapt from your constants/index.ts if needed
    covers = [
        "/covers/adobe.png", "/covers/amazon.png", "/covers/apple.png",
        # Add more covers as in your project
    ]
    return random.choice(covers) if covers else "/covers/default.png"

def generate_interview_questions_ai(role, level, techstack, type, max_questions):
    """
    Placeholder for AI question generation.
    This function should call the Gemini AI to generate questions.
    """
    print(f"AI: Generating questions for role={role}, level={level}, techstack={techstack}, type={type}, max_questions={max_questions}")

    # Actual Gemini call would be here
    # For now, return placeholder questions
    # if not genai.api_key:
    #     print("WARN: Gemini API key not configured. Returning placeholder questions.")
    #     return [f"Placeholder Question {i+1} for {role}" for i in range(int(max_questions))]

    try:
        model = os.getenv('GEMINI_MODEL')# Or your preferred model
        prompt = f"""Prepare questions for a job interview.
The job role is {role}.
The job experience level is {level}.
The tech stack used in the job is: {', '.join(techstack)}.
The focus between behavioural and technical questions should lean towards: {type}.
The amount of questions required is: {max_questions}.
Please return only the questions, without any additional text.
The questions are going to be read by a voice assistant so do not use "/" or "*" or any other special characters which might break the voice assistant.
Return the questions formatted as a JSON list of strings, like this:
["Question 1", "Question 2", "Question 3"]
"""
        response = client.models.generate_content(model=model, contents=prompt, config= {
            "response_mime_type": "application/json",
            "response_schema": InterviewQuestion
        })
        # Assuming the response.text is a JSON string list of questions
        import json
        questions = json.loads(response.text)
        print("questions", questions)
        return questions['questions']
    except Exception as e:
        print(f"Error during Gemini AI call for questions: {e}")
        return [f"Error-generated Question {i+1} for {role}. Details: {e}" for i in range(int(max_questions))]


def generate_feedback_ai(transcript, interview_role="N/A"): # Added interview_role for context
    """
    Placeholder for AI feedback generation.
    This function should call the Gemini AI to generate feedback.
    """
    print(f"AI: Generating feedback for transcript: {transcript[:100]}...") # Print first 100 chars

    # if not genai.api_key:
    #     print("WARN: Gemini API key not configured. Returning placeholder feedback.")
    #     return {
    #         "totalScore": 50,
    #         "categoryScores": [{"name": "Placeholder Category", "score": 50, "comment": "Placeholder comment due to no AI key."}],
    #         "strengths": ["Placeholder strength"],
    #         "areasForImprovement": ["Placeholder improvement area"],
    #         "finalAssessment": "Placeholder final assessment because Gemini API key is not configured.",
    #     }

    formatted_transcript = "\n".join([f"- {item['role']}: {item['content']}" for item in transcript])

    try:
        model = os.getenv('GEMINI_MODEL') # Or your preferred model
        # Schema needs to be defined based on your Firestore structure / feedbackSchema constant
        # For now, let's construct a detailed prompt and expect a JSON response.
        prompt = f"""
You are an AI interviewer analyzing a mock interview for the role of {interview_role}.
Your task is to evaluate the candidate based on the provided transcript.
Score from 0 to 100 in each category.
Transcript:
{formatted_transcript}

Please provide your feedback as a JSON object with the following structure:
{{
  "totalScore": <integer>,
  "categoryScores": [{{ "name": "Communication Skills", "score": <integer>, "comment": "<string>" }}, {{ "name": "Technical Knowledge", "score": <integer>, "comment": "<string>" }}, ...],
  "strengths": ["<string>", ...],
  "areasForImprovement": ["<string>", ...],
  "finalAssessment": "<string>"
}}
Ensure 'totalScore' is an average or weighted score based on category scores.
Categories to assess: Communication Skills, Technical Knowledge, Problem-Solving, Cultural & Role Fit, Confidence & Clarity.
Be thorough and detailed in your analysis.
"""
        response = client.models.generate_content(model=model, contents=prompt, config= {
            "response_mime_type": "application/json",
            "response_schema": FeedbackResponse
        })
        import json
        feedback_data = json.loads(response.text)
        # Basic validation
        if not all(k in feedback_data for k in ["totalScore", "categoryScores", "strengths", "areasForImprovement", "finalAssessment"]):
            raise ValueError("AI response missing required keys.")
        return feedback_data
    except Exception as e:
        print(f"Error during Gemini AI call for feedback: {e}")
        return {
            "totalScore": 10,
            "categoryScores": [{"name": "Error Category", "score": 10, "comment": f"Error during AI feedback generation: {e}"}],
            "strengths": ["Error in generation"],
            "areasForImprovement": ["Fix AI call"],
            "finalAssessment": f"Could not generate feedback due to an error: {e}",
        }

def generate_ai_feedback_for_text_attempt(feedback_instance):
    """
    Generates AI-driven feedback for a completed interview attempt based on
    logged questions and text answers.
    For this subtask, it returns MOCKED data.
    """
    # In a real scenario, you would use feedback_instance.questions_log,
    # feedback_instance.answers_log, and details from feedback_instance.interview
    # to construct a detailed prompt for an LLM.

    print(f"AI: Generating MOCKED feedback for Feedback ID: {feedback_instance.id}")
    print(f"Interview Role: {feedback_instance.interview.role}, Level: {feedback_instance.interview.level}")
    # print(f"Questions Log: {feedback_instance.questions_log}")
    # print(f"Answers Log: {feedback_instance.answers_log}")

    # Fixed categories for now
    fixed_categories = [
        "Clarity & Communication",
        "Technical Proficiency/Relevance",
        "Problem Solving Approach",
        "Behavioral Fit/STAR Method"
    ]

    category_scores_mock = []
    for i, category_name in enumerate(fixed_categories):
        score = random.randint(6, 9) * 10 # Score between 60 and 90
        category_scores_mock.append({
            "name": category_name,
            "score": score / 10, # Assuming score is 0-10 for categories in this mock
            "comment": f"Mock comment for {category_name}: Candidate demonstrated good aspects but could improve slightly in area {i+1}."
        })

    total_score_mock = sum(cs['score'] for cs in category_scores_mock) * 10 / len(category_scores_mock) if category_scores_mock else 75


    return {
        "total_score": int(total_score_mock), # Example: 0-100 scale
        "category_scores": category_scores_mock,
        "strengths": [
            "Mock Strength: Good articulation of ideas.",
            f"Mock Strength: Showed initiative in discussing mock project related to {feedback_instance.interview.role}.",
            "Mock Strength: Positive attitude during the mock interview."
        ],
        "areas_for_improvement": [
            "Mock Improvement: Could provide more specific examples (S.T.A.R method).",
            "Mock Improvement: Elaborate more on technical challenges faced in mock scenarios.",
            f"Mock Improvement: Research more about typical {feedback_instance.interview.level} expectations for a {feedback_instance.interview.role}."
        ],
        "final_assessment": (
            f"This is a mock final assessment. The candidate for the {feedback_instance.interview.role} role "
            "showed promise. Key strengths include clear communication and a positive attitude. "
            "To improve, the candidate should focus on providing more detailed examples using the S.T.A.R. method "
            "and deepen their understanding of advanced topics relevant to the role. Overall, a good mock performance "
            "with identifiable areas for growth."
        )
    }
