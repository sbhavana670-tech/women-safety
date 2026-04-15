"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSafety } from "@/lib/safety-context";
import { Flashlight, X, Zap, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface FlashlightModeProps {
  isOpen: boolean;
  onClose: () => void;
}

type FlashMode = "steady" | "strobe" | "sos";

export function FlashlightMode({ isOpen, onClose }: FlashlightModeProps) {
  const { logActivity } = useSafety();
  const [isOn, setIsOn] = useState(false);
  const [mode, setMode] = useState<FlashMode>("steady");
  const [brightness, setBrightness] = useState(100);
  const torchRef = useRef<MediaStreamTrack | null>(null);
  const strobeIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const flashModes = [
    { id: "steady", label: "Steady", description: "Constant light" },
    { id: "strobe", label: "Strobe", description: "Flashing light" },
    { id: "sos", label: "SOS", description: "Morse code SOS" },
  ] as const;

  const enableTorch = useCallback(async (enable: boolean) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      const track = stream.getVideoTracks()[0];
      
      const capabilities = track.getCapabilities() as MediaTrackCapabilities & { torch?: boolean };
      if (capabilities.torch) {
        await track.applyConstraints({
          advanced: [{ torch: enable } as MediaTrackConstraintSet],
        });
        torchRef.current = track;
        return true;
      }
    } catch (error) {
      console.log("Torch not available:", error);
    }
    return false;
  }, []);

  const toggleFlashlight = useCallback(async () => {
    if (isOn) {
      // Turn off
      if (torchRef.current) {
        torchRef.current.stop();
        torchRef.current = null;
      }
      if (strobeIntervalRef.current) {
        clearInterval(strobeIntervalRef.current);
        strobeIntervalRef.current = null;
      }
      setIsOn(false);
      logActivity("flashlight", "Flashlight turned off");
    } else {
      // Turn on
      const success = await enableTorch(true);
      if (success) {
        setIsOn(true);
        logActivity("flashlight", `Flashlight turned on (${mode} mode)`);
      } else {
        // Fallback to screen flash for devices without torch
        setIsOn(true);
        logActivity("flashlight", `Screen flash mode activated (${mode})`);
      }
    }
  }, [isOn, mode, enableTorch, logActivity]);

  // Handle strobe mode
  useEffect(() => {
    if (!isOn) return;

    if (mode === "strobe") {
      let isFlashOn = true;
      strobeIntervalRef.current = setInterval(async () => {
        if (torchRef.current) {
          await torchRef.current.applyConstraints({
            advanced: [{ torch: isFlashOn } as MediaTrackConstraintSet],
          });
        }
        isFlashOn = !isFlashOn;
      }, 100);
    } else if (mode === "sos") {
      // SOS pattern: ... --- ...
      const sosPattern = [
        // S: ...
        100, 100, 100, 100, 100, 300,
        // O: ---
        300, 100, 300, 100, 300, 300,
        // S: ...
        100, 100, 100, 100, 100, 700,
      ];
      let patternIndex = 0;
      let isFlashOn = true;

      const runSOS = async () => {
        if (torchRef.current) {
          await torchRef.current.applyConstraints({
            advanced: [{ torch: isFlashOn } as MediaTrackConstraintSet],
          });
        }
        isFlashOn = !isFlashOn;
        patternIndex = (patternIndex + 1) % sosPattern.length;
        strobeIntervalRef.current = setTimeout(runSOS, sosPattern[patternIndex]);
      };
      runSOS();
    }

    return () => {
      if (strobeIntervalRef.current) {
        clearInterval(strobeIntervalRef.current);
        clearTimeout(strobeIntervalRef.current);
        strobeIntervalRef.current = null;
      }
    };
  }, [isOn, mode]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (torchRef.current) {
        torchRef.current.stop();
      }
      if (strobeIntervalRef.current) {
        clearInterval(strobeIntervalRef.current);
        clearTimeout(strobeIntervalRef.current);
      }
    };
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-background/80 backdrop-blur-sm p-4">
      {/* Screen flash effect when active (fallback) */}
      {isOn && (
        <div
          className={cn(
            "fixed inset-0 z-40 pointer-events-none transition-opacity",
            mode === "steady" && "bg-white",
            mode === "strobe" && "bg-white animate-pulse",
            mode === "sos" && "bg-white"
          )}
          style={{ opacity: brightness / 100 }}
        />
      )}

      <div className="w-full max-w-md bg-card rounded-xl border shadow-xl overflow-hidden relative z-50">
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <Flashlight className={cn("w-5 h-5", isOn ? "text-warning" : "text-muted-foreground")} />
            <h2 className="text-lg font-semibold">Emergency Flashlight</h2>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-muted rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Flashlight button */}
          <div className="flex justify-center">
            <button
              onClick={toggleFlashlight}
              className={cn(
                "w-32 h-32 rounded-full flex flex-col items-center justify-center transition-all",
                "active:scale-95",
                isOn
                  ? "bg-warning text-warning-foreground shadow-lg shadow-warning/30"
                  : "bg-muted hover:bg-muted/80"
              )}
            >
              {isOn ? (
                <Zap className="w-12 h-12 animate-pulse" />
              ) : (
                <Flashlight className="w-12 h-12" />
              )}
              <span className="text-sm font-medium mt-1">
                {isOn ? "ON" : "OFF"}
              </span>
            </button>
          </div>

          {/* Mode selection */}
          <div>
            <label className="text-sm font-medium mb-3 block">Flash Mode</label>
            <div className="grid grid-cols-3 gap-2">
              {flashModes.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setMode(m.id)}
                  className={cn(
                    "p-3 rounded-lg border text-center transition-colors",
                    mode === m.id
                      ? "border-warning bg-warning/10"
                      : "border-border hover:border-warning/50"
                  )}
                >
                  <div className={cn(
                    "text-sm font-semibold",
                    mode === m.id ? "text-warning" : ""
                  )}>
                    {m.label}
                  </div>
                  <div className="text-xs text-muted-foreground">{m.description}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Brightness control */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium">Brightness</label>
              <span className="text-sm text-muted-foreground">{brightness}%</span>
            </div>
            <input
              type="range"
              min={20}
              max={100}
              value={brightness}
              onChange={(e) => setBrightness(Number(e.target.value))}
              className="w-full accent-warning"
            />
          </div>

          <Button
            onClick={toggleFlashlight}
            size="lg"
            className={cn(
              "w-full",
              isOn ? "bg-destructive hover:bg-destructive/90" : "bg-warning hover:bg-warning/90 text-warning-foreground"
            )}
          >
            {isOn ? "Turn Off Flashlight" : "Turn On Flashlight"}
          </Button>

          <div className="p-3 rounded-lg bg-warning/10 border border-warning/20">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-warning mt-0.5" />
              <p className="text-sm text-warning">
                <strong>Tip:</strong> Use SOS mode in emergencies. The pattern
                (... --- ...) is internationally recognized as a distress signal.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
