"use client";

import { useState, useEffect, useCallback } from "react";
import { useSafety } from "@/lib/safety-context";
import { Timer, Play, Pause, RotateCcw, X, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SafetyTimerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SafetyTimer({ isOpen, onClose }: SafetyTimerProps) {
  const { state, settings, startTimer, cancelTimer, triggerSOS } = useSafety();
  const [selectedDuration, setSelectedDuration] = useState(settings.timerDuration);
  const [timeLeft, setTimeLeft] = useState(0);
  const [showExpiredAlert, setShowExpiredAlert] = useState(false);

  const presetDurations = [5, 10, 15, 30, 45, 60];

  // Calculate time left
  useEffect(() => {
    if (state.isTimerActive && state.timerEndTime) {
      const updateTimeLeft = () => {
        const remaining = Math.max(0, state.timerEndTime! - Date.now());
        setTimeLeft(Math.ceil(remaining / 1000));

        if (remaining <= 0 && state.isTimerActive) {
          setShowExpiredAlert(true);
        }
      };

      updateTimeLeft();
      const interval = setInterval(updateTimeLeft, 1000);
      return () => clearInterval(interval);
    } else {
      setTimeLeft(0);
    }
  }, [state.isTimerActive, state.timerEndTime]);

  const handleStart = useCallback(() => {
    startTimer(selectedDuration);
    setShowExpiredAlert(false);
  }, [selectedDuration, startTimer]);

  const handleCancel = useCallback(() => {
    cancelTimer();
    setShowExpiredAlert(false);
  }, [cancelTimer]);

  const handleImSafe = useCallback(() => {
    cancelTimer();
    setShowExpiredAlert(false);
  }, [cancelTimer]);

  const handleSOS = useCallback(() => {
    setShowExpiredAlert(false);
    triggerSOS();
  }, [triggerSOS]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Timer expired alert
  if (showExpiredAlert) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-destructive/95 p-8">
        <div className="text-center text-destructive-foreground">
          <AlertTriangle className="w-20 h-20 mx-auto mb-4 animate-bounce" />
          <h2 className="text-3xl font-bold mb-2">Timer Expired!</h2>
          <p className="text-lg opacity-80 mb-8">
            Are you safe? Please respond.
          </p>
          <div className="flex flex-col gap-4">
            <Button
              onClick={handleImSafe}
              size="lg"
              className="bg-safe hover:bg-safe/90 text-safe-foreground"
            >
              I&apos;m Safe
            </Button>
            <Button
              onClick={handleSOS}
              size="lg"
              variant="outline"
              className="border-destructive-foreground text-destructive-foreground hover:bg-destructive-foreground/10"
            >
              Send SOS
            </Button>
          </div>
          <p className="text-sm opacity-60 mt-4">
            SOS will be sent automatically in 30 seconds
          </p>
        </div>
      </div>
    );
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-background/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-card rounded-xl border shadow-xl overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <Timer className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold">Safety Timer</h2>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-muted rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {state.isTimerActive ? (
            <div className="text-center">
              <div className="relative w-48 h-48 mx-auto mb-6">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="45"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="4"
                    className="text-muted"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="45"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeDasharray={`${(timeLeft / (selectedDuration * 60)) * 283} 283`}
                    className={cn(
                      "transition-all duration-1000",
                      timeLeft < 60 ? "text-destructive" : 
                      timeLeft < 300 ? "text-warning" : "text-safe"
                    )}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-4xl font-bold font-mono">
                    {formatTime(timeLeft)}
                  </span>
                  <span className="text-sm text-muted-foreground">remaining</span>
                </div>
              </div>

              <div className="flex justify-center gap-4">
                <Button onClick={handleCancel} variant="outline" size="lg">
                  <Pause className="w-4 h-4 mr-2" />
                  Cancel Timer
                </Button>
                <Button onClick={handleImSafe} size="lg" className="bg-safe hover:bg-safe/90 text-safe-foreground">
                  I&apos;m Safe
                </Button>
              </div>

              <p className="text-sm text-muted-foreground mt-4">
                If you don&apos;t respond when the timer ends, an SOS will be sent.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              <div>
                <label className="text-sm font-medium mb-3 block">
                  Select Duration
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {presetDurations.map((duration) => (
                    <button
                      key={duration}
                      onClick={() => setSelectedDuration(duration)}
                      className={cn(
                        "p-3 rounded-lg border text-center transition-colors",
                        selectedDuration === duration
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border hover:border-primary/50"
                      )}
                    >
                      <div className="text-lg font-semibold">{duration}</div>
                      <div className="text-xs text-muted-foreground">mins</div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">
                  Custom Duration: {selectedDuration} minutes
                </label>
                <input
                  type="range"
                  min={1}
                  max={120}
                  value={selectedDuration}
                  onChange={(e) => setSelectedDuration(Number(e.target.value))}
                  className="w-full accent-primary"
                />
              </div>

              <Button onClick={handleStart} className="w-full" size="lg">
                <Play className="w-4 h-4 mr-2" />
                Start Safety Timer
              </Button>

              <div className="p-3 rounded-lg bg-muted/50">
                <p className="text-sm text-muted-foreground">
                  <strong>How it works:</strong> Set a timer for your journey. If you don&apos;t
                  check in before it expires, emergency contacts will be alerted
                  automatically.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
