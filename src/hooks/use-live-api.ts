import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { GenAILiveClient } from "../lib/genai-live-client";
import { LiveClientOptions } from "../types";
import { AudioStreamer } from "../lib/audio-streamer";
import { audioContext } from "../lib/utils";
import VolMeterWorket from "../lib/worklets/vol-meter";
import { LiveConnectConfig } from "@google/genai";

export type UseLiveAPIResults = {
  client: GenAILiveClient;
  setConfig: (config: LiveConnectConfig) => void;
  config: LiveConnectConfig;
  model: string;
  setModel: (model: string) => void;
  connected: boolean;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  volume: number;
};

export function useLiveAPI(options: LiveClientOptions): UseLiveAPIResults {
  const client = useMemo(() => new GenAILiveClient(options), [options]);
  const audioStreamerRef = useRef<AudioStreamer | null>(null);
  const isWorkletRegisteredRef = useRef(false);

  const [model, setModel] = useState<string>("models/gemini-2.0-flash-exp");
  const [config, setConfig] = useState<LiveConnectConfig>({
    tools: [{ googleSearch: {} }],
  });
  const [connected, setConnected] = useState(false);
  const [volume, setVolume] = useState(0);

  // register audio for streaming server -> speakers
  useEffect(() => {
    if (!audioStreamerRef.current && !isWorkletRegisteredRef.current) {
      isWorkletRegisteredRef.current = true;
      audioContext({ id: "audio-out" }).then((audioCtx: AudioContext) => {
        audioStreamerRef.current = new AudioStreamer(audioCtx);
        audioStreamerRef.current
          .addWorklet("vumeter-out", VolMeterWorket, (ev: MessageEvent<{ volume: number }>) => {
            setVolume(ev.data.volume);
          })
          .catch((error) => {
            console.error("Failed to register AudioWorklet:", error);
            isWorkletRegisteredRef.current = false;
          });
      });
    }
  }, []);

  useEffect(() => {
    const onOpen = () => {
      console.log("Gemini Live API connection opened successfully");
      setConnected(true);
    };

    const onClose = (event: CloseEvent) => {
      console.log("Gemini Live API connection closed:", event.code, event.reason);
      setConnected(false);
    };

    const onError = (error: ErrorEvent) => {
      console.error("Gemini Live API connection error:", error);
      setConnected(false);
    };

    const stopAudioStreamer = () => {
      console.log("Stopping audio streamer due to interruption");
      audioStreamerRef.current?.stop();
    };

    const onAudio = (data: ArrayBuffer) => {
      audioStreamerRef.current?.addPCM16(new Uint8Array(data));
    };

    console.log("Setting up Gemini Live API event listeners...");
    
    client
      .on("error", onError)
      .on("open", onOpen)
      .on("close", onClose)
      .on("interrupted", stopAudioStreamer)
      .on("audio", onAudio);

    return () => {
      console.log("Cleaning up Gemini Live API event listeners...");
      client
        .off("error", onError)
        .off("open", onOpen)
        .off("close", onClose)
        .off("interrupted", stopAudioStreamer)
        .off("audio", onAudio)
        .disconnect();
    };
  }, [client]);

  const connect = useCallback(async () => {
    try {
      if (!config) {
        throw new Error("config has not been set");
      }
      
      // Check if API key is available
      if (!options.apiKey) {
        throw new Error("API key is not configured. Please set NEXT_PUBLIC_LIVE_API_KEY environment variable.");
      }
      
      console.log("Attempting to connect to Gemini Live API...");
      console.log("Model:", model);
      console.log("Config:", config);
      
      client.disconnect();
      await client.connect(model, config);
      
      console.log("Connection request sent successfully");
    } catch (error) {
      console.error("Failed to connect to Gemini Live API:", error);
      setConnected(false);
      throw error;
    }
  }, [client, config, model, options.apiKey]);

  const disconnect = useCallback(async () => {
    try {
      console.log("Disconnecting from Gemini Live API...");
      client.disconnect();
      setConnected(false);
      console.log("Disconnected successfully");
    } catch (error) {
      console.error("Error during disconnect:", error);
      setConnected(false);
    }
  }, [setConnected, client]);

  return {
    client,
    config,
    setConfig,
    model,
    setModel,
    connected,
    connect,
    disconnect,
    volume,
  };
}
