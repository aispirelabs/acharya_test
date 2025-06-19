'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';

// Assuming components are in src/components/ (adjust if they are in subfolders like src/components/interview)
import ControlTray from '@/components/ControlTray';
import GeminiInput from '@/components/GeminiInput'; // Will be replaced by textarea for this step
import MicRecorderButton from '@/components/MicRecorderButton';

// Assuming hooks are in src/hooks/
import { useLiveAPI } from '@/hooks/use-live-api';
import { useWebcam } from '@/hooks/use-webcam';
import { useScreenCapture } from '@/hooks/use-screen-capture';

// --- Types ---
interface InterviewDetails {
  id: string;
  role: string;
  type: string;
  level: string;
  questions?: Array<{ id: string | number; text: string }>;
  // ... any other relevant details from your Interview model
}

export default function InterviewPage() {
  const params = useParams();
  const router = useRouter();
  const interviewId = params.interviewId as string;

  const [interviewDetails, setInterviewDetails] = useState<InterviewDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true); // For initial page load (interview details)
  const [error, setError] = useState<string | null>(null); // For initial page load error

  // Media Hooks
  const { videoRef: webcamRef, startWebcam, stopWebcam, webcamStream, webcamActive, currentCameraDeviceId, getCameraDevices } = useWebcam();
  const { screenShareStream, screenShareActive, startScreenShare, stopScreenShare, videoRef: screenShareRef } = useScreenCapture();

  // New states for interview flow
  const [feedbackId, setFeedbackId] = useState<string | null>(null);
  const [currentQuestionText, setCurrentQuestionText] = useState<string | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number | null>(null);
  const [totalQuestionsInInterview, setTotalQuestionsInInterview] = useState<number | null>(null);
  const [interviewSessionStatus, setInterviewSessionStatus] = useState<string | null>(null); // 'pending', 'started', 'in_progress', 'completed', 'terminated'
  const [userAnswerText, setUserAnswerText] = useState('');
  const [isSubmittingAnswer, setIsSubmittingAnswer] = useState(false);
  const [sessionError, setSessionError] = useState<string | null>(null); // For errors during start/submit answer


  // Function to start interview attempt
  const handleStartInterviewAttempt = async (currentInterviewId: string) => {
      setSessionError(null);
      // setIsLoading(true); // This might cause a jarring full page load flicker if details are already loaded.
      // Consider a more specific loading state for this part if needed, or rely on button state.
      const token = localStorage.getItem('accessToken');
      if (!token) {
          setError("Authentication required. Redirecting to sign in..."); // Use main error for this critical failure
          router.push('/signin');
          return;
      }

      try {
          const response = await fetch(`/api/acharya_ai/interviews/${currentInterviewId}/start_attempt/`, {
              method: 'POST',
              headers: { 'Authorization': `Bearer ${token}` }
          });

          if (response.status === 401 || response.status === 403) {
            setSessionError('Session expired or unauthorized to start. Redirecting to sign in...');
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            localStorage.removeItem('userData');
            router.push('/signin');
            return;
          }
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.detail || 'Failed to start interview attempt.');
          }
          const data = await response.json();
          setFeedbackId(data.feedback_id);
          setCurrentQuestionText(data.current_question);
          setCurrentQuestionIndex(data.question_index);
          setTotalQuestionsInInterview(data.total_questions);
          setInterviewSessionStatus(data.session_status);

          if(data.session_status === 'started' && !data.current_question && data.total_questions === 0) {
              setCurrentQuestionText("This interview currently has no questions. Please contact support or the HR manager.");
              setInterviewSessionStatus('completed'); // Effectively completed as there's nothing to do
          } else if (data.session_status === 'completed' && !data.current_question) {
              setCurrentQuestionText("This interview attempt is already completed.");
          }

      } catch (e: any) {
          setSessionError(e.message || "An error occurred while starting the interview.");
          console.error("Start interview error:", e);
      }
      // finally { setIsLoading(false); } // Only if a specific loading state for this action was used
  };

  // Initial fetch for interview details
  useEffect(() => {
    if (!interviewId) {
        setError("Interview ID not found in URL.");
        setIsLoading(false);
        return;
    }
    const fetchInterviewDetails = async () => {
      setIsLoading(true);
      setError(null);
      setSessionError(null); // Clear session errors on new load
      const token = localStorage.getItem('accessToken');

      if (!token) {
        setError('Authentication required. Redirecting to sign in...');
        router.push('/signin');
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/acharya_ai/interviews/${interviewId}/`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (response.status === 401 || response.status === 403) {
          setError('Session expired or unauthorized. Redirecting to sign in...');
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('userData');
          router.push('/signin');
          setIsLoading(false);
          return;
        }
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.detail || `Failed to fetch interview details. Status: ${response.status}`);
        }
        const data: InterviewDetails = await response.json();
        setInterviewDetails(data);
        // After fetching details, automatically try to start the interview attempt
        if (data && data.id) {
            handleStartInterviewAttempt(data.id);
        }

      } catch (err: any) {
        setError(err.message || 'An error occurred while fetching interview details.');
        console.error("Fetch interview details error:", err);
      } finally {
        setIsLoading(false); // This loading is for the initial page data
      }
    };
    fetchInterviewDetails();
  }, [interviewId, router]);

  // Auto-start webcam (remains from previous step)
  useEffect(() => {
    if (interviewDetails && !webcamActive) {
      getCameraDevices().then(devices => {
        if (devices.length > 0) {
          startWebcam(devices[0].deviceId);
        } else {
          console.warn("No camera devices found.");
        }
      });
    }
    return () => {
      if (webcamActive) stopWebcam();
      if (screenShareActive) stopScreenShare();
    };
  }, [interviewDetails, webcamActive, startWebcam, stopWebcam, screenShareActive, stopScreenShare, getCameraDevices]);

  // Function to submit answer
  const handleSubmitAnswer = async () => {
      if (!userAnswerText.trim()) {
          setSessionError("Please type your answer before submitting.");
          return;
      }
      if (feedbackId === null || currentQuestionIndex === null) {
          setSessionError("Interview session not properly started or question index missing.");
          return;
      }
      setSessionError(null);
      setIsSubmittingAnswer(true);
      const token = localStorage.getItem('accessToken');
      if (!token) {
          setSessionError("Authentication missing. Redirecting to sign in...");
          router.push('/signin');
          setIsSubmittingAnswer(false);
          return;
      }

      try {
          const response = await fetch(`/api/acharya_ai/feedback/${feedbackId}/submit_answer/`, {
              method: 'POST',
              headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
              body: JSON.stringify({ answer_text: userAnswerText, question_index: currentQuestionIndex })
          });

          if (response.status === 401 || response.status === 403) {
            setSessionError('Session expired or unauthorized. Redirecting to sign in...');
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            localStorage.removeItem('userData');
            router.push('/signin');
            setIsSubmittingAnswer(false);
            return;
          }
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.detail || 'Failed to submit answer.');
          }
          const data = await response.json();
          setCurrentQuestionText(data.current_question);
          setCurrentQuestionIndex(data.question_index);
          setInterviewSessionStatus(data.session_status);
          setUserAnswerText('');
      } catch (e: any) {
          setSessionError(e.message || "An error occurred while submitting your answer.");
          console.error("Submit answer error:", e);
      }
      finally { setIsSubmittingAnswer(false); }
  };


  if (isLoading && !interviewDetails) return ( // Show main loading only if interviewDetails are not yet fetched
    <div className="flex flex-col justify-center items-center h-[calc(100vh-100px)]">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-600"></div>
        <p className="ml-3 text-lg mt-4">Loading Interview Session...</p>
    </div>
  );

  if (error) return ( // For initial load errors
    <div className="p-8 text-center">
        <p className="text-red-600 text-lg mb-4">Error: {error}</p>
        <button onClick={() => router.back()} className="mt-4 bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600">Go Back</button>
    </div>
  );
  if (!interviewDetails) return ( // If loading finished but no details (e.g. 404 from backend)
    <div className="p-8 text-center text-lg text-gray-700">Interview not found or could not be loaded.</div>
  );

  const isInterviewActive = interviewSessionStatus === 'started' || interviewSessionStatus === 'in_progress';

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <header className="p-3 shadow-md bg-white z-10">
        <h1 className="text-xl font-semibold text-gray-800">Interview for: {interviewDetails.role}</h1>
        <p className="text-xs text-gray-500">Level: {interviewDetails.level} | Type: {interviewDetails.type}</p>
      </header>

      <div className="flex flex-1 p-3 gap-3 overflow-hidden">
        <div className="flex-1 bg-gray-900 rounded-lg flex items-center justify-center relative overflow-hidden shadow-lg">
          {screenShareActive && screenShareRef.current ? (
            <video ref={screenShareRef} autoPlay className="w-full h-full object-contain" />
          ) : (
            <div className="text-gray-400 text-2xl p-8 text-center">AI Interviewer Area</div>
          )}
        </div>

        <div className="w-96 flex flex-col gap-3">
          <div className="bg-black rounded-lg aspect-[4/3] relative overflow-hidden shadow-md">
            {webcamActive && webcamRef.current ? (
              <video ref={webcamRef} autoPlay muted className="w-full h-full object-cover transform scale-x-[-1]" />
            ) : (
              <div className="text-white flex items-center justify-center h-full bg-gray-700">Your Webcam</div>
            )}
          </div>

          <div className="bg-white p-3 rounded-lg shadow-md">
            <ControlTray
              isWebcamOn={webcamActive}
              onToggleWebcam={() => webcamActive ? stopWebcam() : startWebcam(currentCameraDeviceId)}
              isScreenShareOn={screenShareActive}
              onToggleScreenShare={() => screenShareActive ? stopScreenShare() : startScreenShare()}
            />
            <div className="mt-3">
              <MicRecorderButton />
            </div>
          </div>

          <div className="bg-white p-3 rounded-lg shadow-md flex-1 flex flex-col overflow-hidden">
            <h3 className="text-md font-semibold mb-2 text-gray-700 border-b pb-2">Interview Log & Response</h3>
            <div className="space-y-3 flex-1 overflow-y-auto pr-1">
              {currentQuestionText && interviewSessionStatus !== 'completed' && isInterviewActive && (
                <div className="mb-3 p-2.5 bg-blue-50 rounded-md text-sm shadow-sm">
                    <h4 className="font-semibold text-blue-700 mb-1">
                        Question {currentQuestionIndex !== null ? currentQuestionIndex + 1 : '-'}/{totalQuestionsInInterview || '-'}
                    </h4>
                    <p className="text-gray-800 whitespace-pre-wrap">{currentQuestionText}</p>
                </div>
              )}
              {interviewSessionStatus === 'completed' && (
                <div className="p-3 bg-green-50 text-green-700 rounded-lg shadow-sm text-center">
                    <h3 className="text-lg font-semibold">Interview Completed!</h3>
                    <p className="text-sm">Feedback will be processed and made available shortly.</p>
                </div>
              )}
               {interviewSessionStatus === 'started' && !currentQuestionText && totalQuestionsInInterview === 0 && (
                 <div className="p-3 bg-yellow-50 text-yellow-700 rounded-lg shadow-sm text-center">
                    <p className="text-sm">This interview has no questions. Please contact support.</p>
                </div>
               )}
              {sessionError && <p className="text-red-500 text-xs my-2 p-2 bg-red-50 rounded-md">{sessionError}</p>}

              {(isInterviewActive && currentQuestionText) && (
                <div className="mt-3">
                    <label htmlFor="userAnswer" className="block text-sm font-medium text-gray-700 mb-1">Your Answer:</label>
                    <textarea
                        id="userAnswer"
                        value={userAnswerText}
                        onChange={(e) => setUserAnswerText(e.target.value)}
                        placeholder="Type your answer here..."
                        rows={5}
                        className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        disabled={isSubmittingAnswer || interviewSessionStatus === 'completed'}
                    />
                    <button
                        onClick={handleSubmitAnswer}
                        disabled={isSubmittingAnswer || !userAnswerText.trim() || interviewSessionStatus === 'completed'}
                        className="mt-2 w-full px-4 py-2 bg-indigo-600 text-white font-semibold rounded-md hover:bg-indigo-700 disabled:bg-gray-400 transition duration-150"
                    >
                        {isSubmittingAnswer ? 'Submitting...' : 'Submit Answer'}
                    </button>
                </div>
              )}
            </div>
            {/* GeminiInput removed as per instruction to use textarea */}
          </div>
        </div>
      </div>
    </div>
  );
}
