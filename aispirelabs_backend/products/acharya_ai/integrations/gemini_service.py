
import google.generativeai as genai
from django.conf import settings
import json
import re


class GeminiService:
    def __init__(self):
        genai.configure(api_key=settings.GOOGLE_API_KEY)
        self.model = genai.GenerativeModel('gemini-2.0-flash-001')

    def generate_interview_questions(self, role, level, techstack, interview_type, max_questions):
        """Generate interview questions using Gemini AI"""
        try:
            techstack_str = ", ".join(techstack) if isinstance(techstack, list) else techstack
            
            prompt = f"""Prepare questions for a job interview.
            The job role is {role}.
            The job experience level is {level}.
            The tech stack used in the job is: {techstack_str}.
            The focus between behavioural and technical questions should lean towards: {interview_type}.
            The amount of questions required is: {max_questions}.
            Please return only the questions, without any additional text.
            The questions are going to be read by a voice assistant so do not use "/" or "*" or any other special characters which might break the voice assistant.
            Return the questions formatted like this:
            ["Question 1", "Question 2", "Question 3"]
            
            Thank you! <3
            """
            
            response = self.model.generate_content(prompt)
            
            # Clean the response text
            response_text = response.text.strip()
            
            # Try to extract JSON array from the response
            json_match = re.search(r'\[.*\]', response_text, re.DOTALL)
            if json_match:
                questions_json = json_match.group(0)
                questions = json.loads(questions_json)
                return questions
            else:
                # Fallback: split by lines and clean
                lines = response_text.split('\n')
                questions = []
                for line in lines:
                    line = line.strip()
                    if line and not line.startswith('[') and not line.startswith(']'):
                        # Remove numbering and quotes
                        line = re.sub(r'^\d+\.\s*', '', line)
                        line = line.strip('"\'')
                        if line:
                            questions.append(line)
                return questions[:max_questions]
                
        except Exception as e:
            print(f"Error generating questions: {e}")
            # Return fallback questions
            return [
                f"Tell me about your experience with {role}.",
                f"What challenges have you faced in {role} and how did you overcome them?",
                "Describe a project you're proud of and your role in it.",
                "How do you stay updated with the latest technologies?",
                "What are your career goals for the next 5 years?"
            ][:max_questions]

    def analyze_interview_feedback(self, transcript, interview):
        """Analyze interview transcript and provide feedback"""
        try:
            # Convert transcript to readable format
            conversation = []
            for message in transcript:
                role = message.get('role', 'unknown')
                content = message.get('content', '')
                conversation.append(f"{role.upper()}: {content}")
            
            conversation_text = "\n".join(conversation)
            
            prompt = f"""Analyze this job interview transcript and provide detailed feedback.

            Interview Details:
            - Role: {interview.role}
            - Type: {interview.type}
            - Level: {interview.level}
            - Tech Stack: {', '.join(interview.techstack)}

            Transcript:
            {conversation_text}

            Please provide feedback in the following JSON format:
            {{
                "overall_score": 85,
                "strengths": ["Clear communication", "Good technical knowledge"],
                "areas_for_improvement": ["Could provide more specific examples", "Work on confidence"],
                "technical_assessment": "Good understanding of core concepts...",
                "communication_skills": "Clear and articulate responses...",
                "problem_solving": "Demonstrated good analytical thinking...",
                "recommendations": ["Practice more system design questions", "Prepare STAR format examples"]
            }}

            Provide constructive, helpful feedback that will help the candidate improve.
            """
            
            response = self.model.generate_content(prompt)
            
            # Try to extract JSON from response
            response_text = response.text.strip()
            json_match = re.search(r'\{.*\}', response_text, re.DOTALL)
            
            if json_match:
                feedback_json = json_match.group(0)
                feedback_data = json.loads(feedback_json)
                return feedback_data
            else:
                # Fallback feedback structure
                return {
                    "overall_score": 75,
                    "strengths": ["Participated in the interview", "Showed interest in the role"],
                    "areas_for_improvement": ["Could provide more detailed answers"],
                    "technical_assessment": "Needs more detailed evaluation.",
                    "communication_skills": "Adequate communication demonstrated.",
                    "problem_solving": "Problem-solving skills need more demonstration.",
                    "recommendations": ["Practice more interview questions", "Prepare specific examples"]
                }
                
        except Exception as e:
            print(f"Error analyzing feedback: {e}")
            return {
                "overall_score": 70,
                "strengths": ["Completed the interview"],
                "areas_for_improvement": ["Continue practicing"],
                "technical_assessment": "Assessment needs manual review.",
                "communication_skills": "Communication was adequate.",
                "problem_solving": "Problem-solving demonstration needs improvement.",
                "recommendations": ["Keep practicing", "Prepare more examples"]
            }
