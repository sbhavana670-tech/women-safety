"use client";

import { useEffect, useRef, useState, useCallback } from "react";

export function VoiceDetection({ isOpen, onClose, triggerSOS }: any) {
  const recognitionRef = useRef<any>(null);

  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [showAlert, setShowAlert] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // =========================
  // START LISTENING
  // =========================
  const startListening = useCallback(async () => {
    setError(null);
    setTranscript("");
    setShowAlert(false);

    try {
      const SpeechRecognition =
        (window as any).SpeechRecognition ||
        (window as any).webkitSpeechRecognition;

      if (!SpeechRecognition) {
        setError("Speech not supported in this browser");
        return;
      }

      // mic permission
      try {
        await navigator.mediaDevices.getUserMedia({ audio: true });
      } catch {
        setError("Microphone permission denied");
        return;
      }

      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }

      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = false;
      recognition.lang = "en-IN";

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        const text =
          event.results[event.results.length - 1][0].transcript
            .toLowerCase()
            .trim();

        setTranscript(text);
        console.log("🎤 Heard:", text);

        // 🚨 SOS TRIGGER WORDS
        if (
          text.includes("help") ||
          text.includes("emergency") ||
          text.includes("save me") ||
          text.includes("danger")
        ) {
          console.log("🚨 VOICE SOS TRIGGERED");

          setShowAlert(true);

          // 🔥 CALL MAIN SOS FUNCTION
          if (triggerSOS) {
            triggerSOS(text);
          }

          // auto hide alert
          setTimeout(() => setShowAlert(false), 4000);
        }
      };

      recognition.onerror = (event: any) => {
        console.log("Error:", event.error);

        if (event.error === "no-speech") return;
        if (event.error === "aborted") return;

        setError("Voice detection error");
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);

        // restart safely
        setTimeout(() => {
          if (recognitionRef.current) {
            try {
              recognitionRef.current.start();
            } catch {}
          }
        }, 800);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch {
      setError("Something went wrong");
    }
  }, [triggerSOS]);

  // =========================
  // STOP
  // =========================
  const stopListening = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
      recognitionRef.current = null;
    }
    setIsListening(false);
  };

  useEffect(() => {
    return () => stopListening();
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-xl w-[90%] max-w-md shadow-xl">

        <h2 className="text-lg font-bold mb-2">Voice Detection</h2>

        {/* STATUS */}
        <p className="text-sm mb-2">
          Status:{" "}
          <span className={isListening ? "text-green-600" : "text-red-600"}>
            {isListening ? "Listening 🎤" : "Stopped"}
          </span>
        </p>

        {/* LIVE TEXT */}
        {isListening && (
          <p className="text-sm text-blue-600 mb-3">
            🎤 You said: {transcript || "..."}
          </p>
        )}

        {/* ERROR */}
        {error && (
          <p className="text-sm text-red-500 mb-3">
            ⚠ {error}
          </p>
        )}

        {/* ALERT */}
        {showAlert && (
          <div className="bg-red-600 text-white p-3 rounded mb-3 text-center font-bold animate-pulse">
            🚨 SOS ACTIVATED!
          </div>
        )}

        {/* BUTTONS */}
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={startListening}
            className="bg-green-600 text-white px-4 py-2 rounded"
          >
            Start
          </button>

          <button
            onClick={stopListening}
            className="bg-red-600 text-white px-4 py-2 rounded"
          >
            Stop
          </button>

          <button
            onClick={onClose}
            className="bg-gray-300 px-4 py-2 rounded"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}