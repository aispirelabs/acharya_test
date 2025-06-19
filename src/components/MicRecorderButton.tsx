import { cn } from "@/lib/utils";
import { Mic, MicOff } from "lucide-react";
import { Dispatch, SetStateAction } from "react";

export const MicRecorderButton = ({ muted, setMuted }: { muted: boolean, setMuted: Dispatch<SetStateAction<boolean>> }) => (
  <button
    className={cn(
      "relative flex items-center justify-center w-12 h-12",
      "rounded-full transition-all duration-300 ease-out",
      muted
        ? "bg-red-600 shadow-lg shadow-red-500/30"
        : "bg-blue-600 shadow-lg shadow-blue-500/30"
    )}
    onClick={() => setMuted(!muted)}
  >
    {/* Animated pulse rings */}
    <span
      className="absolute top-[-var(--volume)] left-[-var(--volume)] block opacity-35 bg-red-500 rounded-full"
      style={{
        width: `calc(100% + var(--volume) * 1.8)`,
        height: `calc(100% + var(--volume) * 1.8)`,
      }}
    ></span>

    {/* Icon */}
    <div className="relative z-10 text-white">
      {!muted ? <Mic size={24} /> : <MicOff size={24} />}
    </div>
  </button>
);