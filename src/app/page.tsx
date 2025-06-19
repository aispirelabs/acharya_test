'use client';
import { LiveAPIProvider } from "@/contexts/LiveAPIContext";
import ControlTray from "@/components/ControlTray";
import { LiveClientOptions } from "@/types";
import { useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { Camera, Monitor } from "lucide-react";


/* 
  It is not recommended to use the Google AI client SDKs in production apps to call the 
  Google AI Gemini API directly from your mobile and web apps. Instead, you should use a
  backend server to call the Gemini API and then communicate with your frontend app.
*/
const apiOptions: LiveClientOptions = {
  apiKey: process.env.NEXT_PUBLIC_LIVE_API_KEY!,
};

function App() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoStream, setVideoStream] = useState<MediaStream | null>(null);

  const isVideoActive = videoRef.current && videoStream;

  return (
    <LiveAPIProvider options={apiOptions}>
      <div className="flex flex-col h-dvh">

        <div className="w-full flex-grow relative rounded-lg shadow-lg p-4 overflow-hidden">
          {/* Video Element */}
          <video
            className={cn("w-full h-full object-contain rounded-lg bg-black", {
              hidden: !isVideoActive,
            })}
            ref={videoRef}
            autoPlay
            playsInline
          />

          {/* Skeleton/Placeholder when no video stream */}
          {!isVideoActive && (
            <div className="w-full absolute inset-0 dark:bg-gray-800 rounded-lg flex flex-col items-center justify-center">
              <div className="flex items-center space-x-4 mb-4">
                <Camera className="w-8 h-8 text-gray-400" />
                <Monitor className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-500 dark:text-gray-400 text-center max-w-xs">
                Camera or screen share not connected
              </p>
            </div>
          )}
        </div>
        <ControlTray
          videoRef={videoRef}
          onVideoStreamChange={setVideoStream}
        />
      </div>
    </LiveAPIProvider>
  );
}

export default App;