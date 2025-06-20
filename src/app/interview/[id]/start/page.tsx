'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { getInterviewDetail } from '@/lib/api';
import { Interview } from '@/lib/types';
import { ROUTES } from '@/lib/constants';
import { LiveAPIProvider, useLiveAPIContext } from '@/contexts/LiveAPIContext';
import { useWebcam } from '@/hooks/use-webcam';
import { useScreenCapture } from '@/hooks/use-screen-capture';
import { 
  ArrowLeftIcon,
  ClockIcon,
  UserIcon,
  BriefcaseIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
  VideoCameraIcon,
  VideoCameraSlashIcon,
  ComputerDesktopIcon,
  StopIcon,
  PlayIcon,
  PauseIcon
} from '@heroicons/react/24/outline';

// Interview-specific Gemini configuration
const INTERVIEW_CONFIG = {
  apiKey: process.env.NEXT_PUBLIC_LIVE_API_KEY || '',
  model: "models/gemini-2.0-flash-exp",
  tools: [{ googleSearch: {} }],
};

// Component to handle sending interview context to Gemini
function InterviewContextSender({ 
  context, 
  contextSent,
  onContextSent 
}: { 
  context: string; 
  contextSent: boolean;
  onContextSent: () => void; 
}) {
  const { client, connected } = useLiveAPIContext();
  
  useEffect(() => {
    if (connected && context && !contextSent) {
      // Send the interview context to initialize the AI interviewer
      console.log('Sending interview context to Gemini...');
      console.log('Context length:', context.length);
      console.log('Connection status:', connected);
      
      // Add timeout to prevent getting stuck
      const timeoutId = setTimeout(() => {
        console.warn('Context sending timed out, marking as sent');
        onContextSent();
      }, 10000); // 10 second timeout
      
      try {
        client.send({ text: context });
        console.log('Context sent successfully');
        clearTimeout(timeoutId);
        onContextSent();
      } catch (error) {
        console.error('Failed to send context:', error);
        clearTimeout(timeoutId);
        // Still mark as sent to prevent infinite retries
        onContextSent();
      }
    }
  }, [connected, context, contextSent, client, onContextSent]);
  
  // Debug logging
  useEffect(() => {
    console.log('InterviewContextSender state:', {
      connected,
      hasContext: !!context,
      contextSent,
      contextLength: context?.length
    });
  }, [connected, context, contextSent]);
  
  return null; // This component doesn't render anything
}

// Simplified Interview Interface Component
function SimplifiedInterviewInterface({ 
  videoRef, 
  interview, 
  user, 
  timeRemaining, 
  warnings, 
  interviewContext, 
  contextSent, 
  onContextSent,
  onEndInterview
}: {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  interview: Interview;
  user: any;
  timeRemaining: number;
  warnings: number;
  interviewContext: string;
  contextSent: boolean;
  onContextSent: () => void;
  onEndInterview: () => void;
}) {
  const { client, connected, connect, disconnect, volume: apiVolume } = useLiveAPIContext();
  const [muted, setMuted] = useState(false);
  
  // Video Stream Hooks
  const webcam = useWebcam();
  const screenCapture = useScreenCapture();
  const [activeMediaStream, setActiveMediaStream] = useState<MediaStream | null>(null);
  const [isWebcamStreaming, setIsWebcamStreaming] = useState(false);
  const [isScreenCaptureStreaming, setIsScreenCaptureStreaming] = useState(false);

  // Cleanup function for media streams
  const cleanupMediaStreams = () => {
    console.log('Cleaning up media streams...');
    
    // Stop webcam if active
    if (isWebcamStreaming) {
      webcam.stop();
      setIsWebcamStreaming(false);
      console.log('Webcam stopped');
    }
    
    // Stop screen capture if active
    if (isScreenCaptureStreaming) {
      screenCapture.stop();
      setIsScreenCaptureStreaming(false);
      console.log('Screen capture stopped');
    }
    
    // Stop all tracks in the video element
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => {
        track.stop();
        console.log('Stopped track:', track.kind);
      });
      videoRef.current.srcObject = null;
    }
    
    setActiveMediaStream(null);
    console.log('All media streams cleaned up');
  };

  // Enhanced end interview handler
  const handleEndInterviewWithCleanup = () => {
    cleanupMediaStreams();
    onEndInterview();
  };

  // Auto-start webcam when interview starts
  useEffect(() => {
    if (interviewContext && !isWebcamStreaming) {
      startWebcam();
    }
  }, [interviewContext]);

  // Cleanup on component unmount
  useEffect(() => {
    return () => {
      cleanupMediaStreams();
    };
  }, []);

  const startWebcam = async () => {
    try {
      const stream = await webcam.start();
      setActiveMediaStream(stream);
      setIsWebcamStreaming(true);
      setIsScreenCaptureStreaming(false);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error('Failed to start webcam:', error);
    }
  };

  const startScreenCapture = async () => {
    try {
      const stream = await screenCapture.start();
      setActiveMediaStream(stream);
      setIsScreenCaptureStreaming(true);
      setIsWebcamStreaming(false);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error('Failed to start screen capture:', error);
    }
  };

  const stopCurrentStream = () => {
    if (isWebcamStreaming) {
      webcam.stop();
      setIsWebcamStreaming(false);
    }
    if (isScreenCaptureStreaming) {
      screenCapture.stop();
      setIsScreenCaptureStreaming(false);
    }
    setActiveMediaStream(null);
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const handleToggleConnection = async () => {
    try {
      console.log('Attempting to toggle connection...');
      console.log('Current connection status:', connected);
      
      if (connected) {
        console.log('Disconnecting...');
        await disconnect();
        console.log('Disconnected successfully');
      } else {
        console.log('Connecting...');
        await connect();
        console.log('Connection request sent');
        
        // Test if the AI responds after a short delay
        setTimeout(() => {
          if (connected) {
            console.log('Sending test message...');
            try {
              client.send({ text: "Hello, can you hear me?" });
              console.log('Test message sent');
            } catch (error) {
              console.error('Failed to send test message:', error);
            }
          }
        }, 2000);
      }
    } catch (error) {
      console.error("Connection toggle failed:", error);
      alert(`Connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Add audio processing for the interview
  useEffect(() => {
    if (!connected || muted) return;

    console.log('Setting up audio processing...');
    
    // Import AudioRecorder dynamically to avoid SSR issues
    const setupAudio = async () => {
      try {
        const { AudioRecorder } = await import('@/lib/audio-recorder');
        const audioRecorder = new AudioRecorder();
        
        const handleAudioData = (base64: string) => {
          if (connected && !muted) {
            client.sendRealtimeInput([
              {
                mimeType: "audio/pcm;rate=16000",
                data: base64,
              },
            ]);
          }
        };

        audioRecorder.on("data", handleAudioData);
        audioRecorder.start();
        console.log('Audio processing started');

        return () => {
          audioRecorder.off("data", handleAudioData);
          audioRecorder.stop();
        };
      } catch (error) {
        console.error('Failed to setup audio processing:', error);
      }
    };

    setupAudio();
  }, [connected, muted, client]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="max-w-6xl mx-auto">
      {/* Main Video Area */}
      <div className="relative aspect-video bg-black rounded-xl overflow-hidden mb-6">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover"
        />
        
        {/* Interview Status Overlay */}
        <div className="absolute top-4 left-4 flex items-center space-x-3">
          {/* Timer */}
          <div className="bg-black/50 backdrop-blur-sm rounded-lg px-3 py-2">
            <div className="flex items-center space-x-2">
              <ClockIcon className="h-4 w-4 text-white" />
              <span className="text-white font-mono text-lg">{formatTime(timeRemaining)}</span>
            </div>
          </div>
          
          {/* Interview Status */}
          {interviewContext && (
            <div className="bg-black/50 backdrop-blur-sm rounded-lg px-3 py-2">
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${contextSent ? 'bg-green-400' : 'bg-yellow-400'}`}></div>
                <span className="text-white text-sm">
                  {contextSent ? 'AI Ready' : 'Initializing...'}
                </span>
              </div>
            </div>
          )}
          
          {/* Connection Status */}
          <div className="bg-black/50 backdrop-blur-sm rounded-lg px-3 py-2">
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-400' : 'bg-red-400'}`}></div>
              <span className="text-white text-sm">{connected ? 'Connected' : 'Disconnected'}</span>
            </div>
          </div>
          
          {/* Warnings */}
          {warnings > 0 && (
            <div className="bg-yellow-500/80 backdrop-blur-sm rounded-lg px-3 py-2">
              <div className="flex items-center space-x-2">
                <ExclamationTriangleIcon className="h-4 w-4 text-white" />
                <span className="text-white text-sm">Warning {warnings}/3</span>
              </div>
            </div>
          )}
        </div>
        
        {/* Manual Start Button - shown if context is not sent after timeout */}
        {interviewContext && !contextSent && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-6 text-center">
              <h3 className="text-white text-lg font-semibold mb-4">Interview Ready</h3>
              <p className="text-gray-300 mb-4">Click the play button below to start your interview with the AI</p>
              <button
                onClick={handleToggleConnection}
                className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-semibold"
              >
                Start Interview
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Simplified Control Bar */}
      <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-6">
        <div className="flex items-center justify-center space-x-4">
          {/* Mic Control */}
          <button
            onClick={() => setMuted(!muted)}
            className={`flex items-center justify-center w-12 h-12 rounded-full transition-all ${
              muted 
                ? 'bg-red-500 text-white' 
                : 'bg-white/20 text-white hover:bg-white/30'
            }`}
          >
            {muted ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            )}
          </button>

          {/* Video Control */}
          <button
            onClick={() => {
              if (isWebcamStreaming) {
                stopCurrentStream();
              } else {
                startWebcam();
              }
            }}
            className={`flex items-center justify-center w-12 h-12 rounded-full transition-all ${
              isWebcamStreaming 
                ? 'bg-white/20 text-white hover:bg-white/30' 
                : 'bg-red-500 text-white'
            }`}
          >
            {isWebcamStreaming ? (
              <VideoCameraIcon className="w-6 h-6" />
            ) : (
              <VideoCameraSlashIcon className="w-6 h-6" />
            )}
          </button>

          {/* Screen Share */}
          <button
            onClick={() => {
              if (isScreenCaptureStreaming) {
                stopCurrentStream();
              } else {
                startScreenCapture();
              }
            }}
            className={`flex items-center justify-center w-12 h-12 rounded-full transition-all ${
              isScreenCaptureStreaming 
                ? 'bg-blue-500 text-white' 
                : 'bg-white/20 text-white hover:bg-white/30'
            }`}
          >
            {isScreenCaptureStreaming ? (
              <StopIcon className="w-6 h-6" />
            ) : (
              <ComputerDesktopIcon className="w-6 h-6" />
            )}
          </button>

          {/* Connection Toggle */}
          <button
            onClick={handleToggleConnection}
            className={`flex items-center justify-center w-12 h-12 rounded-full transition-all ${
              connected 
                ? 'bg-green-500 text-white hover:bg-green-600' 
                : 'bg-blue-500 text-white hover:bg-blue-600'
            }`}
          >
            {connected ? (
              <PauseIcon className="w-6 h-6" />
            ) : (
              <PlayIcon className="w-6 h-6" />
            )}
          </button>

          {/* End Interview */}
          <button
            onClick={handleEndInterviewWithCleanup}
            className="flex items-center justify-center w-12 h-12 rounded-full bg-red-500 text-white hover:bg-red-600 transition-all"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M3 3l18 18" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

function InterviewInterface() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [interview, setInterview] = useState<Interview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [interviewStarted, setInterviewStarted] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [warnings, setWarnings] = useState(0);
  const [transcript, setTranscript] = useState<Array<{role: string, content: string}>>([]);
  const [interviewContext, setInterviewContext] = useState<string>('');
  const [contextSent, setContextSent] = useState(false);
  const [connected, setConnected] = useState(false);
  const [muted, setMuted] = useState(false);
  const [isWebcamStreaming, setIsWebcamStreaming] = useState(false);
  const [isScreenCaptureStreaming, setIsScreenCaptureStreaming] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (id) {
      fetchInterviewDetails();
    }
  }, [id]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (interviewStarted && timeRemaining > 0) {
      timer = setTimeout(() => {
        setTimeRemaining(prev => prev - 1);
      }, 1000);
    } else if (timeRemaining === 0 && interviewStarted) {
      // Auto-end interview when time runs out
      console.log('Time ran out, ending interview...');
      handleEndInterview();
    }
    return () => clearTimeout(timer);
  }, [timeRemaining, interviewStarted]);

  // Cleanup when component unmounts or user navigates away
  useEffect(() => {
    const handleBeforeUnload = () => {
      // Clean up media streams when user leaves the page
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
        videoRef.current.srcObject = null;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      // Also cleanup on component unmount
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
        videoRef.current.srcObject = null;
      }
    };
  }, []);

  const fetchInterviewDetails = async () => {
    try {
      setLoading(true);
      const data = await getInterviewDetail(id as string);
      setInterview(data);
      setTimeRemaining(data.time_limit * 60); // Convert minutes to seconds
    } catch (err: any) {
      setError('Failed to fetch interview details');
      console.error('Error fetching interview:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStartInterview = () => {
    setInterviewStarted(true);
    setContextSent(false); // Reset context sent state
    
    // Initialize interview context with Gemini
    const context = `You are an AI interviewer conducting a ${interview?.type} interview for a ${interview?.level} level ${interview?.role} position. 
    
    CANDIDATE INFORMATION:
    - Name: ${user?.first_name} ${user?.last_name}
    - Position: ${interview?.role}
    - Level: ${interview?.level}
    - Interview Type: ${interview?.type}
    
    TECHNICAL REQUIREMENTS:
    - Tech Stack: ${Array.isArray(interview?.techstack) ? interview.techstack.join(', ') : interview?.techstack}
    - Job Description: ${interview?.job_description || 'Not provided'}
    
    INTERVIEW GUIDELINES:
    1. Start by introducing yourself as the AI interviewer for this ${interview?.type} interview
    2. Ask relevant technical questions based on the ${interview?.level} level and tech stack
    3. Be professional, friendly, and conversational
    4. Listen carefully to responses and ask follow-up questions
    5. Provide constructive feedback throughout the conversation
    6. Monitor for any suspicious behavior (copying, looking away frequently, etc.)
    7. Give warnings if you detect cheating (max 3 warnings)
    8. End the interview if cheating continues after 3 warnings
    9. Keep track of the interview time (${interview?.time_limit} minutes total)
    10. Ask about 5-8 questions depending on the depth of responses
    
    SPECIFIC INSTRUCTIONS:
    - For technical interviews: Focus on coding concepts, problem-solving, and technical knowledge
    - For behavioral interviews: Focus on past experiences, teamwork, and soft skills
    - For mixed interviews: Balance both technical and behavioral questions
    - Always maintain a professional but approachable tone
    - Provide specific feedback on answers when appropriate
    
    Begin the interview by introducing yourself and explaining the interview process.`;
    
    setInterviewContext(context);
    console.log('Starting interview with context:', context);
  };

  // Enhanced interview ending with feedback generation
  const handleEndInterview = async () => {
    try {
      console.log('Interview ended. Cleaning up media streams...');
      
      // Clean up all media streams
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => {
          track.stop();
          console.log('Stopped track:', track.kind);
        });
        videoRef.current.srcObject = null;
      }
      
      console.log('Media streams cleaned up successfully');
      
      if (!interview) {
        console.error('Interview data not available');
        router.push(`/interview/${id}/results`);
        return;
      }
      
      // TODO: Generate AI feedback based on transcriptions and video analysis
      const feedback = await generateInterviewFeedback(transcript, interview, user);
      
      // TODO: Save feedback to backend
      console.log('Generated feedback:', feedback);
      
      // Navigate to results page
      router.push(`/interview/${id}/results`);
    } catch (error) {
      console.error('Error ending interview:', error);
      // Still navigate to results page even if feedback generation fails
      router.push(`/interview/${id}/results`);
    }
  };

  // Placeholder function for AI feedback generation
  const generateInterviewFeedback = async (transcript: Array<{role: string, content: string}>, interview: Interview, user: any) => {
    // This would integrate with an AI service to analyze the interview
    // For now, return a placeholder feedback structure
    return {
      overallScore: 85,
      categories: {
        technical: { score: 80, strengths: ['Good problem-solving approach'], improvements: ['Could provide more detailed explanations'] },
        communication: { score: 90, strengths: ['Clear and articulate'], improvements: ['Could ask more clarifying questions'] },
        problemSolving: { score: 85, strengths: ['Logical thinking'], improvements: ['Could consider edge cases more'] }
      },
      summary: 'Strong technical foundation with good communication skills. Areas for improvement include providing more detailed explanations and considering edge cases.',
      recommendations: [
        'Practice explaining complex technical concepts in detail',
        'Work on considering edge cases in problem-solving',
        'Continue developing communication skills'
      ]
    };
  };

  const handleBackToInterview = () => {
    router.push(`/interview/${id}`);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const startWebcam = () => {
    // Implementation of starting webcam
    setIsWebcamStreaming(true);
  };

  const stopCurrentStream = () => {
    // Implementation of stopping current stream
    setIsWebcamStreaming(false);
  };

  const startScreenCapture = () => {
    // Implementation of starting screen capture
    setIsScreenCaptureStreaming(true);
  };

  const handleToggleConnection = () => {
    // Implementation of toggling connection
    setConnected(!connected);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-purple-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4"></div>
          <p className="text-gray-300">Loading interview...</p>
        </div>
      </div>
    );
  }

  if (error || !interview) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-purple-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 text-lg mb-4">{error || 'Interview not found'}</p>
          <button
            onClick={handleBackToInterview}
            className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Back to Interview
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-purple-900">
      {/* Header */}
      <header className="bg-white/10 backdrop-blur-md border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={handleBackToInterview}
                className="flex items-center text-white hover:text-gray-300 transition-colors"
              >
                <ArrowLeftIcon className="h-5 w-5 mr-2" />
                Back
              </button>
              <h1 className="text-xl font-bold text-white">{interview.title || interview.role}</h1>
            </div>
            <div className="flex items-center space-x-4">
              {interviewStarted && (
                <>
                  <div className="flex items-center space-x-2 text-white">
                    <ClockIcon className="h-5 w-5" />
                    <span className="font-mono text-lg">{formatTime(timeRemaining)}</span>
                  </div>
                  {warnings > 0 && (
                    <div className="flex items-center space-x-2 text-yellow-400">
                      <ExclamationTriangleIcon className="h-5 w-5" />
                      <span className="text-sm">Warning {warnings}/3</span>
                    </div>
                  )}
                </>
              )}
              <div className="text-white">
                <span className="text-sm text-gray-300">Welcome,</span>
                <p className="font-semibold">{user?.first_name} {user?.last_name}</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!interviewStarted ? (
          /* Pre-interview Setup */
          <div className="text-center space-y-8">
            <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-8">
              <h2 className="text-3xl font-bold text-white mb-4">Ready to Start Your AI Interview?</h2>
              <p className="text-gray-300 text-lg mb-8 max-w-2xl mx-auto">
                This is a {interview.type} interview for {interview.role} position. 
                You'll have {interview.time_limit} minutes to complete the interview with our AI interviewer.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white/5 rounded-lg p-4">
                  <ClockIcon className="h-8 w-8 text-blue-400 mx-auto mb-2" />
                  <p className="text-white font-semibold">{interview.time_limit} minutes</p>
                  <p className="text-gray-400 text-sm">Time limit</p>
                </div>
                <div className="bg-white/5 rounded-lg p-4">
                  <UserIcon className="h-8 w-8 text-green-400 mx-auto mb-2" />
                  <p className="text-white font-semibold">AI Interviewer</p>
                  <p className="text-gray-400 text-sm">Voice & Video</p>
                </div>
                <div className="bg-white/5 rounded-lg p-4">
                  <BriefcaseIcon className="h-8 w-8 text-purple-400 mx-auto mb-2" />
                  <p className="text-white font-semibold">{interview.level} Level</p>
                  <p className="text-gray-400 text-sm">Difficulty</p>
                </div>
              </div>

              <div className="bg-yellow-500/20 border border-yellow-500/50 rounded-lg p-4 mb-8">
                <h3 className="text-yellow-200 font-semibold mb-2">Before you start:</h3>
                <ul className="text-yellow-100 text-sm space-y-1 text-left max-w-md mx-auto">
                  <li>• Make sure you're in a quiet environment</li>
                  <li>• Test your microphone and camera</li>
                  <li>• Have a stable internet connection</li>
                  <li>• Close other applications that might interfere</li>
                  <li>• Be ready for voice and video interaction</li>
                </ul>
              </div>

              <button
                onClick={handleStartInterview}
                className="px-8 py-4 bg-gradient-to-r from-green-500 to-blue-600 text-white rounded-lg font-semibold hover:from-green-600 hover:to-blue-700 transition-all text-lg"
              >
                Start AI Interview
              </button>
            </div>
          </div>
        ) : (
          /* Live Interview Interface with Gemini */
          <LiveAPIProvider options={INTERVIEW_CONFIG}>
            <InterviewContextSender context={interviewContext} contextSent={contextSent} onContextSent={() => setContextSent(true)} />
            
            {/* Single Interview Interface */}
            <SimplifiedInterviewInterface 
              videoRef={videoRef} 
              interview={interview} 
              user={user} 
              timeRemaining={timeRemaining} 
              warnings={warnings} 
              interviewContext={interviewContext} 
              contextSent={contextSent} 
              onContextSent={() => setContextSent(true)} 
              onEndInterview={handleEndInterview}
            />
          </LiveAPIProvider>
        )}
      </div>
    </div>
  );
}

export default function InterviewStartPage() {
  return <InterviewInterface />;
} 