"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useSafety } from "@/lib/safety-context";
import { Mic, MicOff, Volume2, X, Settings, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface VoiceDetectionProps {
  isOpen: boolean;
  onClose: () => void;
}

// Speech recognition types
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
  isFinal: boolean;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}

interface SpeechRecognitionInstance extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
}

declare global {
  interface Window {
    SpeechRecognition?: new () => SpeechRecognitionInstance;
    webkitSpeechRecognition?: new () => SpeechRecognitionInstance;
  }
}

export function VoiceDetection({ isOpen, onClose }: VoiceDetectionProps) {
  const { state, settings, updateSettings, triggerSOS, toggleVoiceDetection, logActivity } = useSafety();
  const [isListening, setIsListening] = useState(false);
  const [lastHeard, setLastHeard] = useState<string | null>(null);
  const [newTriggerWord, setNewTriggerWord] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const analyzerRef = useRef<AnalyserNode | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  const startListening = useCallback(async () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      logActivity("voice", "Speech recognition not supported");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const last = event.results[event.results.length - 1];
      const transcript = last[0].transcript.toLowerCase().trim();
      setLastHeard(transcript);

      const triggered = settings.voiceTriggerWords.some(word =>
        transcript.includes(word.toLowerCase())
      );

      if (triggered) {
        triggerSOS();
        logActivity("voice", `Voice trigger detected: "${transcript}"`);
        recognition.stop();
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      if (event.error === "no-speech") {
        // Ignore silent periods
        return;
      }
      console.error("Speech recognition error:", event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      // Auto-restart if detection is still active
      if (state.isVoiceDetectionActive) {
        setTimeout(() => recognition.start(), 500);
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);

    // Audio visualization
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioContextRef.current = new AudioContext();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      const analyzer = audioContextRef.current.createAnalyser();
      analyzer.fftSize = 256;
      source.connect(analyzer);
      analyzerRef.current = analyzer;

      const updateLevel = () => {
        if (analyzerRef.current && state.isVoiceDetectionActive) {
          const dataArray = new Uint8Array(analyzerRef.current.frequencyBinCount);
          analyzerRef.current.getByteFrequencyData(dataArray);
          const average = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
          setAudioLevel(average);
          requestAnimationFrame(updateLevel);
        }
      };
      updateLevel();
    } catch {
      console.log("Microphone access not available");
    }
  }, [settings.voiceTriggerWords, triggerSOS, logActivity, state.isVoiceDetectionActive]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    setIsListening(false);
    setAudioLevel(0);
  }, []);

  useEffect(() => {
    if (state.isVoiceDetectionActive && !isListening) {
      startListening();
    } else if (!state.isVoiceDetectionActive && isListening) {
      stopListening();
    }
  }, [state.isVoiceDetectionActive, startListening, stopListening, isListening]);

  useEffect(() => () => stopListening(), [stopListening]);

  const handleAddTriggerWord = useCallback(() => {
    if (newTriggerWord.trim() && !settings.voiceTriggerWords.includes(newTriggerWord.trim().toLowerCase())) {
      updateSettings({
        voiceTriggerWords: [...settings.voiceTriggerWords, newTriggerWord.trim().toLowerCase()]
      });
      setNewTriggerWord("");
    }
  }, [newTriggerWord, settings.voiceTriggerWords, updateSettings]);

  const handleRemoveTriggerWord = useCallback((word: string) => {
    updateSettings({
      voiceTriggerWords: settings.voiceTriggerWords.filter(w => w !== word)
    });
  }, [settings.voiceTriggerWords, updateSettings]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-background/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-card rounded-xl border shadow-xl overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <Mic className={cn("w-5 h-5", state.isVoiceDetectionActive ? "text-primary" : "text-muted-foreground")} />
            <h2 className="text-lg font-semibold">Voice Detection</h2>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowSettings(!showSettings)} className={cn("p-1 hover:bg-muted rounded-lg", showSettings && "bg-muted")}>
              <Settings className="w-5 h-5" />
            </button>
            <button onClick={onClose} className="p-1 hover:bg-muted rounded-lg">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6">
          {showSettings ? (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Trigger Words</label>
                <div className="flex flex-wrap gap-2 mb-3">
                  {settings.voiceTriggerWords.map((word) => (
                    <div key={word} className="flex items-center gap-1 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm">
                      <span>{word}</span>
                      <button onClick={() => handleRemoveTriggerWord(word)} className="hover:text-destructive">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    value={newTriggerWord}
                    onChange={(e) => setNewTriggerWord(e.target.value)}
                    placeholder="Add new trigger word"
                    onKeyDown={(e) => e.key === "Enter" && handleAddTriggerWord()}
                  />
                  <Button onClick={handleAddTriggerWord} size="icon">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-muted/50">
                <p className="text-sm text-muted-foreground">
                  When any of these words are detected, SOS will be triggered automatically.
                  Speak clearly and loudly for best results.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Audio visualization */}
              <div className="relative h-32 flex items-center justify-center">
                <div className={cn("absolute w-24 h-24 rounded-full transition-all", state.isVoiceDetectionActive ? "bg-primary/20" : "bg-muted")} style={{ transform: `scale(${1 + audioLevel / 100})` }} />
                <div className={cn("absolute w-16 h-16 rounded-full transition-all", state.isVoiceDetectionActive ? "bg-primary/40" : "bg-muted")} style={{ transform: `scale(${1 + audioLevel / 150})` }} />
                <div className={cn("relative w-20 h-20 rounded-full flex items-center justify-center", state.isVoiceDetectionActive ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>
                  {state.isVoiceDetectionActive ? <Volume2 className="w-8 h-8 animate-pulse" /> : <MicOff className="w-8 h-8" />}
                </div>
              </div>

              <div className="text-center">
                <p className={cn("text-lg font-medium", state.isVoiceDetectionActive ? "text-primary" : "text-muted-foreground")}>
                  {state.isVoiceDetectionActive ? "Listening..." : "Voice Detection Off"}
                </p>
                {lastHeard && state.isVoiceDetectionActive && (
                  <p className="text-sm text-muted-foreground mt-1">Last heard: &quot;{lastHeard}&quot;</p>
                )}
              </div>

              <div className="p-3 rounded-lg bg-muted/50">
                <p className="text-xs text-muted-foreground mb-2">Listening for:</p>
                <div className="flex flex-wrap gap-1">
                  {settings.voiceTriggerWords.map((word) => (
                    <span key={word} className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs">{word}</span>
                  ))}
                </div>
              </div>

              <Button onClick={toggleVoiceDetection} size="lg" className={cn("w-full", state.isVoiceDetectionActive ? "bg-destructive hover:bg-destructive/90" : "")}>
                {state.isVoiceDetectionActive ? (
                  <>
                    <MicOff className="w-4 h-4 mr-2" /> Stop Listening
                  </>
                ) : (
                  <>
                    <Mic className="w-4 h-4 mr-2" /> Start Voice Detection
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}