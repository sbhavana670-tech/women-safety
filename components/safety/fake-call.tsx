"use client";

import { useState, useEffect, useCallback } from "react";
import { useSafety } from "@/lib/safety-context";
import { Phone, PhoneOff, User, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface FakeCallProps {
  isOpen: boolean;
  onClose: () => void;
}

const DEFAULT_CALLERS = [
  { name: "Mom", avatar: "M" },
  { name: "Dad", avatar: "D" },
  { name: "Best Friend", avatar: "BF" },
  { name: "Work", avatar: "W" },
  { name: "Police", avatar: "P" },
];

export function FakeCall({ isOpen, onClose }: FakeCallProps) {
  const { logActivity } = useSafety();
  const [isRinging, setIsRinging] = useState(false);
  const [isOnCall, setIsOnCall] = useState(false);
  const [selectedCaller, setSelectedCaller] = useState(DEFAULT_CALLERS[0]);
  const [customCaller, setCustomCaller] = useState("");
  const [delay, setDelay] = useState(3); // seconds
  const [callDuration, setCallDuration] = useState(0);

  const triggerCall = useCallback(() => {
    const caller = customCaller || selectedCaller.name;
    setTimeout(() => {
      setIsRinging(true);
      logActivity("fake_call", `Fake call incoming from ${caller}`);
    }, delay * 1000);
  }, [customCaller, delay, logActivity, selectedCaller.name]);

  const answerCall = useCallback(() => {
    setIsRinging(false);
    setIsOnCall(true);
    logActivity("fake_call", "Fake call answered");
  }, [logActivity]);

  const endCall = useCallback(() => {
    setIsRinging(false);
    setIsOnCall(false);
    setCallDuration(0);
    logActivity("fake_call", "Fake call ended");
  }, [logActivity]);

  // Call duration timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isOnCall) {
      interval = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isOnCall]);

  // Vibration pattern for incoming call
  useEffect(() => {
    if (isRinging && "vibrate" in navigator) {
      const pattern = [200, 100, 200, 100, 200];
      const interval = setInterval(() => {
        navigator.vibrate(pattern);
      }, 1000);
      return () => {
        clearInterval(interval);
        navigator.vibrate(0);
      };
    }
  }, [isRinging]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const currentCaller = customCaller || selectedCaller.name;
  const currentAvatar = customCaller ? customCaller[0].toUpperCase() : selectedCaller.avatar;

  // Full screen incoming call UI
  if (isRinging) {
    return (
      <div className="fixed inset-0 z-50 bg-gradient-to-b from-primary/90 to-primary flex flex-col items-center justify-between py-16 px-8">
        <div className="text-center text-primary-foreground">
          <p className="text-lg opacity-80 mb-2">Incoming Call</p>
          <div className="w-24 h-24 rounded-full bg-primary-foreground/20 flex items-center justify-center mx-auto mb-4 animate-pulse">
            <span className="text-4xl font-bold">{currentAvatar}</span>
          </div>
          <h2 className="text-3xl font-bold mb-2">{currentCaller}</h2>
          <p className="opacity-60">Mobile</p>
        </div>

        <div className="flex gap-16">
          <button
            onClick={endCall}
            className="w-16 h-16 rounded-full bg-destructive flex items-center justify-center shadow-lg active:scale-95"
          >
            <PhoneOff className="w-7 h-7 text-destructive-foreground" />
          </button>
          <button
            onClick={answerCall}
            className="w-16 h-16 rounded-full bg-safe flex items-center justify-center shadow-lg active:scale-95"
          >
            <Phone className="w-7 h-7 text-safe-foreground" />
          </button>
        </div>
      </div>
    );
  }

  // Active call UI
  if (isOnCall) {
    return (
      <div className="fixed inset-0 z-50 bg-gradient-to-b from-card to-background flex flex-col items-center justify-between py-16 px-8">
        <div className="text-center">
          <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <span className="text-4xl font-bold text-primary">{currentAvatar}</span>
          </div>
          <h2 className="text-3xl font-bold mb-2">{currentCaller}</h2>
          <p className="text-safe font-medium">{formatDuration(callDuration)}</p>
        </div>

        <button
          onClick={endCall}
          className="w-16 h-16 rounded-full bg-destructive flex items-center justify-center shadow-lg active:scale-95"
        >
          <PhoneOff className="w-7 h-7 text-destructive-foreground" />
        </button>
      </div>
    );
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-background/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-card rounded-xl border shadow-xl overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">Fake Call</h2>
          <button onClick={onClose} className="p-1 hover:bg-muted rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">
              Select Caller
            </label>
            <div className="flex flex-wrap gap-2">
              {DEFAULT_CALLERS.map((caller) => (
                <button
                  key={caller.name}
                  onClick={() => {
                    setSelectedCaller(caller);
                    setCustomCaller("");
                  }}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors",
                    selectedCaller.name === caller.name && !customCaller
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-primary/50"
                  )}
                >
                  <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center">
                    <User className="w-3 h-3" />
                  </div>
                  <span className="text-sm">{caller.name}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">
              Or Custom Name
            </label>
            <Input
              value={customCaller}
              onChange={(e) => setCustomCaller(e.target.value)}
              placeholder="Enter custom caller name"
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">
              Call After (seconds): {delay}
            </label>
            <input
              type="range"
              min={1}
              max={60}
              value={delay}
              onChange={(e) => setDelay(Number(e.target.value))}
              className="w-full accent-primary"
            />
          </div>

          <Button onClick={triggerCall} className="w-full" size="lg">
            <Phone className="w-4 h-4 mr-2" />
            Schedule Fake Call
          </Button>

          <p className="text-xs text-muted-foreground text-center">
            The call will appear in {delay} seconds after you press the button.
            Use this to escape uncomfortable situations.
          </p>
        </div>
      </div>
    </div>
  );
}
