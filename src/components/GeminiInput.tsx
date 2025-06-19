import { useRef } from "react";
import { useLiveAPIContext } from "../contexts/LiveAPIContext";
import { cn } from "@/lib/utils";

export default function GeminiTextInput() {
  const { connected, client } = useLiveAPIContext();
  const inputRef = useRef<HTMLInputElement>(null);

  const getInputValue = () => inputRef.current?.value.trim() || "";

  const handleSubmit = () => {
    const text = getInputValue();
    if (text) {
      client.send([{ text }]);
      if (inputRef.current) {
        inputRef.current.value = "";
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className={cn({
      "pointer-events-none": !connected,
      "opacity-50": !connected,
    })}>
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: "0.75rem",
        padding: "1rem",
        borderRadius: "0.75rem",
        backgroundColor: "#f9fafb",
        boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
        border: "1px solid #e5e7eb",
        width: "100%",
        maxWidth: "48rem",
        margin: "0 auto",
      }}>
        <input
          ref={inputRef}
          style={{
            flex: 1,
            padding: "0.75rem 1rem",
            border: "1px solid #d1d5db",
            borderRadius: "0.5rem",
            backgroundColor: "#ffffff",
            color: "#111827",
            fontSize: "1rem",
            outline: "none",
            fontFamily: "inherit",
            transition: "border-color 0.2s ease-in-out",
          }}
          onKeyDown={handleKeyDown}
          placeholder="Type your message..."
        />
        <button
          style={{
            padding: "0.5rem 1rem",
            border: "none",
            borderRadius: "0.5rem",
            backgroundColor: "#3b82f6",
            color: "white",
            cursor: "pointer",
            fontSize: "1rem",
            transition: "background-color 0.2s ease-in-out",
            fontWeight: "600",
          }}
          onClick={handleSubmit}
          disabled={!connected}
        >
          Send
        </button>
      </div>
    </div>
  );
}
