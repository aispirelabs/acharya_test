"use client";

import AudioResponsePulse from "@/components/AudioResponsePulse";
import { MicRecorderButton } from "@/components/MicRecorderButton";
import { useLiveAPIContext } from "@/contexts/LiveAPIContext";
import { UseMediaStreamResult } from "@/hooks/use-media-stream-types"; // Assuming this is { stream: MediaStream | null, start: () => Promise<MediaStream | null>, stop: () => void, isStreaming: boolean, error: Error | null }
import { useScreenCapture } from "@/hooks/use-screen-capture";
import { useWebcam } from "@/hooks/use-webcam";
import { AudioRecorder } from "@/lib/audio-recorder";
import { GenAILiveClient } from "@/lib/genai-live-client";
import { cn } from "@/lib/utils";
import { MonitorUp, MonitorX, Pause, Play, Video, VideoOff } from "lucide-react";
import { memo, ReactNode, RefObject, useCallback, useEffect, useMemo, useRef, useState } from "react";

// --- Constants ---
const AUDIO_MIME_TYPE = "audio/pcm;rate=16000";
const VIDEO_MIME_TYPE = "image/jpeg";
const VIDEO_FRAME_SEND_INTERVAL_MS = 2000; // Send video frame every 2 seconds
const VIDEO_QUALITY = 1.0;
const VIDEO_SCALE_FACTOR = 0.25; // Scale video to 25% of original size
const MIN_VOLUME_PX = 5;
const MAX_VOLUME_PX = 8;
const VOLUME_MULTIPLIER = 200;

// --- Types ---
export type ControlTrayProps = {
  videoRef: RefObject<HTMLVideoElement | null>;
  onVideoStreamChange?: (stream: MediaStream | null) => void;
};

type MediaStreamButtonProps = {
  isStreaming: boolean;
  onIcon: ReactNode;
  offIcon: ReactNode;
  start: () => void;
  stop: () => void;
  label: string; // For accessibility
};

// --- Helper Components ---
const MediaStreamButton = memo(
  ({ isStreaming, onIcon, offIcon, start, stop, label }: MediaStreamButtonProps) => (
    <button
      aria-label={label}
      className="flex items-center justify-center w-12 h-12 rounded-[18px] border border-transparent bg-neutral-200 text-neutral-600 text-xl leading-7 transition-all duration-200 ease-in-out hover:bg-transparent hover:border-neutral-200"
      onClick={isStreaming ? stop : start}
    >
      {isStreaming ? onIcon : offIcon}
    </button>
  )
);
MediaStreamButton.displayName = "MediaStreamButton";


// --- Custom Hooks ---

/**
 * Handles audio recording, input volume visualization, and sending audio data.
 */
function useAudioProcessor(
  connected: boolean,
  client: GenAILiveClient, // Use the specific client type
  muted: boolean
) {
  const [audioRecorder] = useState(() => new AudioRecorder());
  const [inputVolume, setInputVolume] = useState(0);

  useEffect(() => {
    document.documentElement.style.setProperty(
      "--volume",
      `${Math.max(MIN_VOLUME_PX, Math.min(inputVolume * VOLUME_MULTIPLIER, MAX_VOLUME_PX))}px`
    );
  }, [inputVolume]);

  useEffect(() => {
    const handleAudioData = (base64: string) => {
      client.sendRealtimeInput([
        {
          mimeType: AUDIO_MIME_TYPE,
          data: base64,
        },
      ]);
    };

    if (connected && !muted && audioRecorder) {
      audioRecorder.on("data", handleAudioData);
      audioRecorder.on("volume", setInputVolume);
      audioRecorder.start();
    } else {
      audioRecorder.stop();
    }

    return () => {
      audioRecorder.off("data", handleAudioData);
      audioRecorder.off("volume", setInputVolume);
      // Ensure stop is called if component unmounts while recording
      if (audioRecorder.recording) {
        audioRecorder.stop();
      }
    };
  }, [connected, client, muted, audioRecorder]);

  return { inputVolume }; // Only returning what might be needed elsewhere, if anything
}

/**
 * Handles capturing, processing, and sending video frames.
 */
interface VideoFrameProcessorProps {
  videoRef: RefObject<HTMLVideoElement | null>;
  activeVideoStream: MediaStream | null;
  connected: boolean;
  client: GenAILiveClient; // Use the specific client type
}
const VideoFrameProcessor = ({
  videoRef,
  activeVideoStream,
  connected,
  client,
}: VideoFrameProcessorProps) => {
  const renderCanvasRef = useRef<HTMLCanvasElement>(null);

  // Effect to assign the active video stream to the video element
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.srcObject = activeVideoStream;
    }
    // Cleanup: remove srcObject when component unmounts or stream changes to null
    const localVideoRef = videoRef.current;
    return () => {
      if (localVideoRef && localVideoRef.srcObject === activeVideoStream && activeVideoStream === null) {
        localVideoRef.srcObject = null;
      }
    };
  }, [activeVideoStream, videoRef]);

  // Effect to capture and send video frames
  useEffect(() => {
    let timeoutId: number = -1;
    let animationFrameId: number = -1;

    function sendVideoFrame() {
      const videoElement = videoRef.current;
      const canvasElement = renderCanvasRef.current;

      // Check if conditions are met to process and send a frame
      if (
        !videoElement ||
        !canvasElement ||
        !activeVideoStream ||
        videoElement.paused ||
        videoElement.ended ||
        videoElement.videoWidth === 0 ||
        videoElement.videoHeight === 0 // Added height check for completeness
      ) {
        // If still connected and stream is active, try again later
        if (connected && activeVideoStream) {
          timeoutId = window.setTimeout(sendVideoFrame, VIDEO_FRAME_SEND_INTERVAL_MS);
        }
        return;
      }

      const context = canvasElement.getContext("2d");
      if (!context) {
        if (connected && activeVideoStream) { // Reschedule if context somehow fails but still connected
          timeoutId = window.setTimeout(sendVideoFrame, VIDEO_FRAME_SEND_INTERVAL_MS);
        }
        return;
      }

      // Set canvas dimensions based on video and scale factor
      canvasElement.width = videoElement.videoWidth * VIDEO_SCALE_FACTOR;
      canvasElement.height = videoElement.videoHeight * VIDEO_SCALE_FACTOR;

      // Draw image and send if dimensions are valid
      if (canvasElement.width > 0 && canvasElement.height > 0) {
        context.drawImage(videoElement, 0, 0, canvasElement.width, canvasElement.height);
        const base64WithPrefix = canvasElement.toDataURL(VIDEO_MIME_TYPE, VIDEO_QUALITY);
        const base64Data = base64WithPrefix.slice(base64WithPrefix.indexOf(",") + 1);
        client.sendRealtimeInput([{ mimeType: VIDEO_MIME_TYPE, data: base64Data }]);
      }

      // Schedule the next frame send if still connected and stream is active
      if (connected && activeVideoStream) {
        timeoutId = window.setTimeout(sendVideoFrame, VIDEO_FRAME_SEND_INTERVAL_MS);
      }
    }

    if (connected && activeVideoStream) {
      // Use requestAnimationFrame for the first call to sync with rendering,
      // then sendVideoFrame will use setTimeout for subsequent calls.
      animationFrameId = requestAnimationFrame(sendVideoFrame);
    }

    // Cleanup function
    return () => {
      if (animationFrameId !== -1) {
        cancelAnimationFrame(animationFrameId);
      }
      if (timeoutId !== -1) {
        clearTimeout(timeoutId);
      }
    };
  }, [connected, activeVideoStream, client, videoRef]); // Removed renderCanvasRef as it's stable

  // This component renders a hidden canvas used for processing
  return <canvas style={{ display: "none" }} ref={renderCanvasRef} />;
};



/**
 * Manages selection and activation of video streams (webcam, screen capture).
 */
function useStreamSwitcher(
  webcamHook: UseMediaStreamResult,
  screenCaptureHook: UseMediaStreamResult,
  onVideoStreamChange: (stream: MediaStream | null) => void
) {
  const [activeStreamSource, setActiveStreamSource] = useState<"webcam" | "screen" | null>(null);
  const [activeMediaStream, setActiveMediaStream] = useState<MediaStream | null>(null);

  const allStreams = useMemo(() => ({
    webcam: webcamHook,
    screen: screenCaptureHook,
  }), [webcamHook, screenCaptureHook]);

  const switchStream = useCallback(async (newSource: "webcam" | "screen" | null) => {
    // Stop current active stream if it's different from the new source or if new source is null
    if (activeStreamSource && (activeStreamSource !== newSource || newSource === null)) {
      allStreams[activeStreamSource].stop();
    }

    if (newSource) {
      try {
        const stream = await allStreams[newSource].start();
        setActiveMediaStream(stream);
        onVideoStreamChange(stream);
        setActiveStreamSource(newSource);
      } catch (error) {
        console.error(`Failed to start ${newSource} stream:`, error);
        setActiveMediaStream(null);
        onVideoStreamChange(null);
        setActiveStreamSource(null);
      }
    } else {
      // If newSource is null, means we are stopping the current stream
      setActiveMediaStream(null);
      onVideoStreamChange(null);
      setActiveStreamSource(null);
    }
  }, [activeStreamSource, allStreams, onVideoStreamChange]); // webcamHook, screenCaptureHook are stable references from custom hooks

  const stopCurrentStream = useCallback(() => {
    switchStream(null);
  }, [switchStream]);

  const startWebcam = useCallback(() => switchStream("webcam"), [switchStream]);
  const startScreenCapture = useCallback(() => switchStream("screen"), [switchStream]);

  return {
    activeMediaStream,
    isWebcamStreaming: webcamHook.isStreaming,
    isScreenCaptureStreaming: screenCaptureHook.isStreaming,
    startWebcam,
    startScreenCapture,
    stopCurrentStream,
  };
}


// --- Main Component ---
function ControlTray({
  videoRef,
  onVideoStreamChange = () => { },
}: ControlTrayProps) {
  const { client, connected, connect, disconnect, volume: apiVolume } = useLiveAPIContext();

  const [muted, setMuted] = useState(false);
  const connectButtonRef = useRef<HTMLButtonElement>(null);

  // Video Stream Hooks
  const webcam = useWebcam();
  const screenCapture = useScreenCapture();

  const {
    activeMediaStream,
    isWebcamStreaming,
    isScreenCaptureStreaming,
    startWebcam,
    startScreenCapture,
    stopCurrentStream
  } = useStreamSwitcher(webcam, screenCapture, onVideoStreamChange);

  useAudioProcessor(connected, client, muted);

  // Focus connect button when disconnected
  useEffect(() => {
    if (!connected && connectButtonRef.current) {
      connectButtonRef.current.focus();
    }
  }, [connected]);

  const handleToggleConnection = useCallback(() => {
    if (connected) {
      disconnect();
    } else {
      connect();
    }
  }, [connected, connect, disconnect]);


  return (
    <div className="flex flex-col items-center justify-center gap-4 p-4 bg-gray-600 rounded-lg shadow-lg">
      <AudioResponsePulse
        volume={apiVolume}
        active={connected}
        size={300}
        rgbColor="0, 150, 255"
      />
      <section className="flex items-center gap-2">
        <VideoFrameProcessor
          videoRef={videoRef}
          activeVideoStream={activeMediaStream}
          connected={connected}
          client={client}
        />
        <nav
          className={cn(
            "inline-flex items-center gap-3 border border-neutral-500 rounded-full p-2 transition-all duration-700 ease-in bg-white",
            { "pointer-events-none opacity-50": !connected }
          )}
        >
          <MicRecorderButton muted={muted} setMuted={setMuted} />
          <MediaStreamButton
            label="Toggle Screen Share"
            isStreaming={isScreenCaptureStreaming}
            start={startScreenCapture}
            stop={stopCurrentStream}
            onIcon={<MonitorX size={24} />}
            offIcon={<MonitorUp size={24} />}
          />
          <MediaStreamButton
            label="Toggle Webcam"
            isStreaming={isWebcamStreaming}
            start={startWebcam}
            stop={stopCurrentStream}
            onIcon={<VideoOff size={24} />}
            offIcon={<Video size={24} />}
          />
        </nav>

        <div className={cn("flex flex-col justify-center items-center", { connected })}>
          <div className="rounded-full border border-neutral-500 bg-white p-2">
            <button
              ref={connectButtonRef}
              aria-label={connected ? "Pause connection" : "Start connection"}
              className={cn(
                "flex items-center justify-center w-12 h-12 rounded-[18px] text-white",
                {
                  "bg-blue-800 text-blue-500 hover:border-blue-500": connected, // Note: text-blue-500 might not be visible on bg-blue-800
                  "bg-blue-500": !connected,
                }
              )}
              onClick={handleToggleConnection}
            >
              {connected ? <Pause size={24} /> : <Play size={24} />}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

export default memo(ControlTray);