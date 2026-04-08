"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useSafety } from "@/lib/safety-context";
import { Volume2, VolumeX, AlertTriangle, X, Siren } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface AlarmSystemProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AlarmSystem({ isOpen, onClose }: AlarmSystemProps) {
  const { logActivity } = useSafety();
  const [isAlarmActive, setIsAlarmActive] = useState(false);
  const [volume, setVolume] = useState(100);
  const [alarmType, setAlarmType] = useState<"siren" | "whistle" | "scream">("siren");
  const audioContextRef = useRef<AudioContext | null>(null);
  const oscillatorRef = useRef<OscillatorNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);

  const alarmTypes = [
    { id: "siren", label: "Siren", icon: Siren },
    { id: "whistle", label: "Whistle", icon: Volume2 },
    { id: "scream", label: "Scream", icon: AlertTriangle },
  ] as const;

  const createAlarmSound = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    }

    const ctx = audioContextRef.current;
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    gainNode.gain.value = volume / 100;

    switch (alarmType) {
      case "siren":
        oscillator.type = "sawtooth";
        oscillator.frequency.setValueAtTime(400, ctx.currentTime);
        // Create siren effect
        const sirenInterval = setInterval(() => {
          if (oscillatorRef.current) {
            oscillatorRef.current.frequency.linearRampToValueAtTime(
              oscillatorRef.current.frequency.value === 400 ? 800 : 400,
              ctx.currentTime + 0.5
            );
          }
        }, 500);
        oscillator.onended = () => clearInterval(sirenInterval);
        break;
      case "whistle":
        oscillator.type = "sine";
        oscillator.frequency.value = 2000;
        break;
      case "scream":
        oscillator.type = "square";
        oscillator.frequency.value = 1000;
        // Add some variation
        const screamInterval = setInterval(() => {
          if (oscillatorRef.current) {
            oscillatorRef.current.frequency.value = 800 + Math.random() * 400;
          }
        }, 100);
        oscillator.onended = () => clearInterval(screamInterval);
        break;
    }

    oscillator.start();
    oscillatorRef.current = oscillator;
    gainNodeRef.current = gainNode;
  }, [alarmType, volume]);

  const stopAlarmSound = useCallback(() => {
    if (oscillatorRef.current) {
      oscillatorRef.current.stop();
      oscillatorRef.current.disconnect();
      oscillatorRef.current = null;
    }
    if (gainNodeRef.current) {
      gainNodeRef.current.disconnect();
      gainNodeRef.current = null;
    }
  }, []);

  const toggleAlarm = useCallback(() => {
    if (isAlarmActive) {
      stopAlarmSound();
      setIsAlarmActive(false);
      logActivity("alarm", "Emergency alarm deactivated");
    } else {
      createAlarmSound();
      setIsAlarmActive(true);
      logActivity("alarm", `Emergency ${alarmType} alarm activated`);
      
      // Vibrate if supported
      if ("vibrate" in navigator) {
        navigator.vibrate([500, 200, 500, 200, 500]);
      }
    }
  }, [isAlarmActive, alarmType, createAlarmSound, stopAlarmSound, logActivity]);

  // Update volume in real-time
  useEffect(() => {
    if (gainNodeRef.current) {
      gainNodeRef.current.gain.value = volume / 100;
    }
  }, [volume]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopAlarmSound();
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, [stopAlarmSound]);

  // Full screen alarm when active
  if (isAlarmActive) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-destructive animate-pulse p-8">
        <Siren className="w-32 h-32 text-destructive-foreground mb-8 animate-bounce" />
        <h1 className="text-4xl font-bold text-destructive-foreground mb-4">
          ALARM ACTIVE
        </h1>
        <p className="text-lg text-destructive-foreground/80 mb-8 text-center">
          Emergency alarm is sounding. Tap to stop.
        </p>
        <Button
          onClick={toggleAlarm}
          size="lg"
          variant="outline"
          className="border-destructive-foreground text-destructive-foreground hover:bg-destructive-foreground/10 px-12 py-6 text-xl"
        >
          <VolumeX className="w-6 h-6 mr-2" />
          STOP ALARM
        </Button>
      </div>
    );
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-background/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-card rounded-xl border shadow-xl overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <Volume2 className="w-5 h-5 text-destructive" />
            <h2 className="text-lg font-semibold">Emergency Alarm</h2>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-muted rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div>
            <label className="text-sm font-medium mb-3 block">Alarm Type</label>
            <div className="grid grid-cols-3 gap-2">
              {alarmTypes.map((type) => (
                <button
                  key={type.id}
                  onClick={() => setAlarmType(type.id)}
                  className={cn(
                    "flex flex-col items-center gap-2 p-4 rounded-lg border transition-colors",
                    alarmType === type.id
                      ? "border-destructive bg-destructive/10"
                      : "border-border hover:border-destructive/50"
                  )}
                >
                  <type.icon
                    className={cn(
                      "w-6 h-6",
                      alarmType === type.id
                        ? "text-destructive"
                        : "text-muted-foreground"
                    )}
                  />
                  <span className="text-sm font-medium">{type.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium">Volume</label>
              <span className="text-sm text-muted-foreground">{volume}%</span>
            </div>
            <input
              type="range"
              min={50}
              max={100}
              value={volume}
              onChange={(e) => setVolume(Number(e.target.value))}
              className="w-full accent-destructive"
            />
          </div>

          <Button
            onClick={toggleAlarm}
            size="lg"
            className="w-full bg-destructive hover:bg-destructive/90 text-destructive-foreground"
          >
            <Siren className="w-5 h-5 mr-2" />
            Activate Emergency Alarm
          </Button>

          <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
            <p className="text-sm text-destructive">
              <strong>Warning:</strong> This will produce a very loud sound to
              attract attention in emergencies. Use only when necessary.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
