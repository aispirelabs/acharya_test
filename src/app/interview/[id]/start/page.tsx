'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { getInterviewDetail, createFeedback } from '@/lib/api';
import { Interview } from '@/lib/types';
import { ROUTES } from '@/lib/constants';
import { LiveAPIProvider, useLiveAPIContext } from '@/contexts/LiveAPIContext';
import { useWebcam } from '@/hooks/use-webcam';
import { useScreenCapture } from '@/hooks/use-screen-capture';
import { 
  ArrowLeftIcon,
  ClockIcon,
  VideoCameraIcon,
  VideoCameraSlashIcon,
  ComputerDesktopIcon,
  StopIcon,
  PlayIcon,
  PauseIcon,
  MicIcon,
  MicOffIcon
} from '@heroicons/react/24/outline';

// Interview-specific Gemini configuration
const INTERVIEW_CONFIG = {
  apiKey: process.env.NEXT_PUBLIC_LIVE_API_KEY || '',
  model: "models/gemini-2.0-flash-exp",
  tools: [],
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
      console.log('Sending interview context to Gemini...');
      
      const timeoutId = setTimeout(() => {
        console.warn('Context sending timed out, marking as sent');
        onContextSent();
      }, 10000);
      
      try {
        client.send({ text: context });
        console.log('Context sent successfully');
        clearTimeout(timeoutId);
        onContextSent();
      } catch (error) {
        console.error('Failed to send context:', error);
        clearTimeout(timeoutId);
        onContextSent();
      }
    }
  }, [connected, context, contextSent, client, onContextSent]);
  
  return null;
}

// Main Interview Interface Component
function InterviewInterface({ 
  videoRef, 
  interview, 
  user, 
  timeRemaining, 
  interviewContext, 
  contextSent, 
  onContextSent,
  onEndInterview,
  transcript,
  setTranscript
}: {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  interview: Interview;
  user: any;
  timeRemaining: number;
  interviewContext: string;
  contextSent: boolean;
  onContextSent: () => void;
  onEndInterview: () => void;
  transcript: Array<{role: string, content: string, timestamp: number}>;
  setTranscript: React.Dispatch<React.SetStateAction<Array<{role: string, content: string, timestamp: number}>>>;
}) {
  const { client, connected, connect, disconnect, volume: apiVolume } = useLiveAPIContext();
  const [muted, setMuted] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  
  // Video Stream Hooks
  const webcam = useWebcam();
  const screenCapture = useScreenCapture();
  const [activeMediaStream, setActiveMediaStream] = useState<MediaStream | null>(null);
  const [isWebcamStreaming, setIsWebcamStreaming] = useState(false);
  const [isScreenCaptureStreaming, setIsScreenCaptureStreaming] = useState(false);

  // Audio recording for transcript
  const audioRecorderRef = useRef<any>(null);

  // Cleanup function for media streams
  const cleanupMediaStreams = () => {
    console.log('Cleaning up media streams...');
    
    if (isWebcamStreaming) {
      webcam.stop();
      setIsWebcamStreaming(false);
    }
    
    if (isScreenCaptureStreaming) {
      screenCapture.stop();
      setIsScreenCaptureStreaming(false);
    }
    
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => {
        track.stop();
      });
      videoRef.current.srcObject = null;
    }
    
    if (audioRecorderRef.current) {
      audioRecorderRef.current.stop();
    }
    
    setActiveMediaStream(null);
  };

  // Auto-start webcam when interview starts
  useEffect(() => {
    if (interviewContext && !isWebcamStreaming) {
      startWebcam();
    }
  }, [interviewContext]);

  // Setup audio recording for transcript
  useEffect(() => {
    const setupAudioRecording = async () => {
      if (connected && !muted && !audioRecorderRef.current) {
        try {
          const { AudioRecorder } = await import('@/lib/audio-recorder');
          audioRecorderRef.current = new AudioRecorder();
          
          audioRecorderRef.current.on("data", (base64: string) => {
            if (connected && !muted) {
              client.sendRealtimeInput([
                {
                  mimeType: "audio/pcm;rate=16000",
                  data: base64,
                },
              ]);
            }
          });

          audioRecorderRef.current.start();
          setIsRecording(true);
        } catch (error) {
          console.error('Failed to setup audio recording:', error);
        }
      }
    };

    if (connected && !muted) {
      setupAudioRecording();
    }

    return () => {
      if (audioRecorderRef.current) {
        audioRecorderRef.current.stop();
        audioRecorderRef.current = null;
        setIsRecording(false);
      }
    };
  }, [connected, muted, client]);

  // Listen for AI responses and add to transcript
  useEffect(() => {
    const handleContent = (content: any) => {
      if (content.modelTurn && content.modelTurn.parts) {
        const textParts = content.modelTurn.parts.filter((part: any) => part.text);
        if (textParts.length > 0) {
          const aiResponse = textParts.map((part: any) => part.text).join(' ');
          setTranscript(prev => [...prev, {
            role: 'assistant',
            content: aiResponse,
            timestamp: Date.now()
          }]);
        }
      }
    };

    client.on('content', handleContent);

    return () => {
      client.off('content', handleContent);
    };
  }, [client, setTranscript]);

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
      if (connected) {
        await disconnect();
      } else {
        await connect();
      }
    } catch (error) {
      console.error("Connection toggle failed:", error);
      alert(`Connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleToggleMute = () => {
    setMuted(!muted);
    if (audioRecorderRef.current) {
      if (!muted) {
        audioRecorderRef.current.stop();
        setIsRecording(false);
      } else {
        audioRecorderRef.current.start();
        setIsRecording(true);
      }
    }
  };

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
                  {contextSent ? 'AI Interviewer Ready' : 'Initializing AI...'}
                </span>
              </div>
            </div>
          )}
          
          {/* Connection Status */}
          <div className="bg-black/50 backdrop-blur-sm rounded-lg px-3 py-2">
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-400' : 'bg-red-400'}`}></div>
              <span className="text-white text-sm">{connected ? 'Live' : 'Disconnected'}</span>
            </div>
          </div>
          
          {/* Recording Status */}
          {isRecording && (
            <div className="bg-red-500/80 backdrop-blur-sm rounded-lg px-3 py-2">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 rounded-full bg-white animate-pulse"></div>
                <span className="text-white text-sm">Recording</span>
              </div>
            </div>
          )}
        </div>

        {/* AI Volume Indicator */}
        {connected && apiVolume > 0 && (
          <div className="absolute bottom-4 right-4">
            <div className="bg-blue-500/80 backdrop-blur-sm rounded-lg px-3 py-2">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 rounded-full bg-white animate-pulse"></div>
                <span className="text-white text-sm">AI Speaking</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Control Bar */}
      <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-6">
        <div className="flex items-center justify-center space-x-4">
          {/* Mic Control */}
          <button
            onClick={handleToggleMute}
            className={`flex items-center justify-center w-12 h-12 rounded-full transition-all ${
              muted 
                ? 'bg-red-500 text-white' 
                : 'bg-white/20 text-white hover:bg-white/30'
            }`}
          >
            {muted ? (
              <MicOffIcon className="w-6 h-6" />
            ) : (
              <MicIcon className="w-6 h-6" />
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
            onClick={onEndInterview}
            className="flex items-center justify-center w-12 h-12 rounded-full bg-red-500 text-white hover:bg-red-600 transition-all"
          >
            <StopIcon className="w-6 h-6" />
          </button>
        </div>
      </div>
    </div>
  );
}

function InterviewStartPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [interview, setInterview] = useState<Interview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [interviewStarted, setInterviewStarted] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [transcript, setTranscript] = useState<Array<{role: string, content: string, timestamp: number}>>([]);
  const [interviewContext, setInterviewContext] = useState<string>('');
  const [contextSent, setContextSent] = useState(false);
  const [isGeneratingFeedback, setIsGeneratingFeedback] = useState(false);
  
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
      handleEndInterview();
    }
    return () => clearTimeout(timer);
  }, [timeRemaining, interviewStarted]);

  const fetchInterviewDetails = async () => {
    try {
      setLoading(true);
      const data = await getInterviewDetail(id as string);
      setInterview(data);
      setTimeRemaining(data.time_limit * 60);
    } catch (err: any) {
      setError('Failed to fetch interview details');
      console.error('Error fetching interview:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStartInterview = () => {
    setInterviewStarted(true);
    setContextSent(false);
    
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
You are a professional, experienced interviewer. Conduct this interview as if you were a human interviewer in a real interview setting. 

BEHAVIOR INSTRUCTIONS:
1. Start by introducing yourself warmly and professionally
2. Explain the interview process briefly
3. Ask questions one at a time and wait for complete responses
4. Listen actively and ask relevant follow-up questions
5. Be encouraging and supportive while maintaining professionalism
6. Monitor the candidate's behavior through video - note if they seem nervous, confident, or distracted
7. Adapt your questioning style based on their responses and comfort level
8. For technical questions, allow them to think and work through problems
9. If they're struggling, provide gentle hints or guidance
10. Keep track of time and pace the interview appropriately

QUESTION STRATEGY:
- Start with easier questions to build confidence
- Gradually increase difficulty based on their responses
- Mix technical and behavioral questions as appropriate for the interview type
- Ask about specific experiences and examples
- Probe deeper into interesting or unclear responses
- Allow natural conversation flow while staying focused

MONITORING GUIDELINES:
- Pay attention to their video feed for non-verbal cues
- Note confidence levels, communication skills, and professionalism
- Observe problem-solving approach and thought processes
- Watch for any signs of dishonesty or inappropriate behavior

IMPORTANT: 
- Speak naturally and conversationally, as a human would
- Don't mention that you're an AI
- Be personable and build rapport
- Keep responses concise but thorough
- End the interview naturally when time is appropriate or all topics are covered

Begin the interview now by introducing yourself and starting the conversation.`;
    
    setInterviewContext(context);
  };

  const generateFeedbackFromTranscript = async (transcript: Array<{role: string, content: string, timestamp: number}>) => {
    try {
      setIsGeneratingFeedback(true);
      
      // Format transcript for AI analysis
      const formattedTranscript = transcript.map(item => ({
        role: item.role === 'assistant' ? 'interviewer' : 'candidate',
        content: item.content
      }));

      // Create feedback request
      const feedbackData = {
        interview_id: id as string,
        transcript: formattedTranscript
      };

      await createFeedback(feedbackData);
      console.log('Feedback generated successfully');
    } catch (error) {
      console.error('Error generating feedback:', error);
    } finally {
      setIsGeneratingFeedback(false);
    }
  };

  const handleEndInterview = async () => {
    try {
      console.log('Interview ended. Cleaning up and generating feedback...');
      
      // Clean up media streams
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => {
          track.stop();
        });
        videoRef.current.srcObject = null;
      }
      
      // Generate feedback from transcript
      if (transcript.length > 0) {
        await generateFeedbackFromTranscript(transcript);
      }
      
      // Navigate to results page
      router.push(`/interview/${id}/results`);
    } catch (error) {
      console.error('Error ending interview:', error);
      router.push(`/interview/${id}/results`);
    }
  };

  const handleBackToInterview = () => {
    router.push(`/interview/${id}`);
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
                <div className="flex items-center space-x-2 text-white">
                  <ClockIcon className="h-5 w-5" />
                  <span className="font-mono text-lg">{Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, '0')}</span>
                </div>
              )}
              <div className="text-white">
                <span className="text-sm text-gray-300">Candidate:</span>
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
                You'll be interviewed by an AI interviewer who will conduct a natural, human-like conversation. 
                The AI can see and hear you, so maintain professional behavior throughout.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white/5 rounded-lg p-4">
                  <ClockIcon className="h-8 w-8 text-blue-400 mx-auto mb-2" />
                  <p className="text-white font-semibold">{interview.time_limit} minutes</p>
                  <p className="text-gray-400 text-sm">Interview duration</p>
                </div>
                <div className="bg-white/5 rounded-lg p-4">
                  <VideoCameraIcon className="h-8 w-8 text-green-400 mx-auto mb-2" />
                  <p className="text-white font-semibold">Live Video & Audio</p>
                  <p className="text-gray-400 text-sm">Real-time interaction</p>
                </div>
                <div className="bg-white/5 rounded-lg p-4">
                  <ComputerDesktopIcon className="h-8 w-8 text-purple-400 mx-auto mb-2" />
                  <p className="text-white font-semibold">Screen Sharing</p>
                  <p className="text-gray-400 text-sm">For coding challenges</p>
                </div>
              </div>

              <div className="bg-yellow-500/20 border border-yellow-500/50 rounded-lg p-4 mb-8">
                <h3 className="text-yellow-200 font-semibold mb-2">Before you start:</h3>
                <ul className="text-yellow-100 text-sm space-y-1 text-left max-w-md mx-auto">
                  <li>• Ensure good lighting for your video</li>
                  <li>• Test your microphone and camera</li>
                  <li>• Find a quiet, professional environment</li>
                  <li>• Have a stable internet connection</li>
                  <li>• Be ready for natural conversation</li>
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
        ) : isGeneratingFeedback ? (
          /* Generating Feedback */
          <div className="text-center space-y-8">
            <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-8">
              <h2 className="text-3xl font-bold text-white mb-4">Generating Your Feedback</h2>
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4"></div>
              <p className="text-gray-300 text-lg">
                Our AI is analyzing your interview performance and generating detailed feedback...
              </p>
            </div>
          </div>
        ) : (
          /* Live Interview Interface with Gemini */
          <LiveAPIProvider options={INTERVIEW_CONFIG}>
            <InterviewContextSender 
              context={interviewContext} 
              contextSent={contextSent} 
              onContextSent={() => setContextSent(true)} 
            />
            
            <InterviewInterface 
              videoRef={videoRef} 
              interview={interview} 
              user={user} 
              timeRemaining={timeRemaining} 
              interviewContext={interviewContext} 
              contextSent={contextSent} 
              onContextSent={() => setContextSent(true)} 
              onEndInterview={handleEndInterview}
              transcript={transcript}
              setTranscript={setTranscript}
            />
          </LiveAPIProvider>
        )}
      </div>
    </div>
  );
}

export default InterviewStartPage;