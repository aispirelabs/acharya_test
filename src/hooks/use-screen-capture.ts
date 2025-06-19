import { useState, useEffect, useMemo, useCallback } from "react";
import { UseMediaStreamResult } from "./use-media-stream-types";

export function useScreenCapture(): UseMediaStreamResult {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);

  useEffect(() => {
    const handleStreamEnded = () => {
      setIsStreaming(false);
      setStream(null);
    };

    if (stream) {
      // Capture tracks at the time the effect runs to prevent stale closures
      const tracks = stream.getTracks();
      tracks.forEach((track) => track.addEventListener("ended", handleStreamEnded));

      return () => {
        // Clean up using the same tracks reference
        tracks.forEach((track) =>
          track.removeEventListener("ended", handleStreamEnded)
        );
      };
    }
  }, [stream]);

  const start = useCallback(async () => {
    try {
      // Stop existing stream first to prevent orphaned streams
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }

      // Optional: Use CaptureController for better UX
      // const controller = new CaptureController();
      // controller.setFocusBehavior("no-focus-change");

      const mediaStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        // controller
      });

      setStream(mediaStream);
      setIsStreaming(true);
      return mediaStream;
    } catch (error) {
      // Reset state on error
      setIsStreaming(false);
      setStream(null);
      throw error;
    }
  }, [stream]);

  const stop = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
      setIsStreaming(false);
    }
  }, [stream]);

  // Memoize the result to prevent unnecessary re-renders
  const result: UseMediaStreamResult = useMemo(() => ({
    type: "screen",
    start,
    stop,
    isStreaming,
    stream,
  }), [start, stop, isStreaming, stream]);

  return result;
}