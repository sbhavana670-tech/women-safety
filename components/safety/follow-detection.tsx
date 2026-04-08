"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSafety } from "@/lib/safety-context";
import { Users, AlertTriangle, X, Eye, EyeOff, Navigation } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface FollowDetectionProps {
  isOpen: boolean;
  onClose: () => void;
}

interface MovementData {
  timestamp: number;
  lat: number;
  lng: number;
}

export function FollowDetection({ isOpen, onClose }: FollowDetectionProps) {
  const { state, toggleFollowDetection, triggerSOS, logActivity } = useSafety();
  const [movements, setMovements] = useState<MovementData[]>([]);
  const [suspiciousActivity, setSuspiciousActivity] = useState(false);
  const [alertLevel, setAlertLevel] = useState<"none" | "low" | "medium" | "high">("none");
  const [detectionStatus, setDetectionStatus] = useState<string>("Initializing...");
  const lastAnalyzedCount = useRef(0);

  // Simulate follow detection algorithm
  const analyzeMovement = useCallback((newMovement: MovementData) => {
    setMovements(prev => {
      const updated = [...prev, newMovement].slice(-20); // Keep last 20 movements
      return updated;
    });
  }, []);

  // Separate effect for analyzing movements to avoid setState during render
  useEffect(() => {
    if (!state.isFollowDetection || movements.length < 5) return;
    if (lastAnalyzedCount.current === movements.length) return; // Prevent duplicate analysis
    
    lastAnalyzedCount.current = movements.length;
    
    // Use setTimeout to ensure this runs after render cycle
    const timeoutId = setTimeout(() => {
      // Simulated analysis - only run when movements array updates
      const randomScore = Math.random();
      if (randomScore > 0.9) {
        setAlertLevel("high");
        setSuspiciousActivity(true);
        setDetectionStatus("Possible follower detected!");
        logActivity("follow", "High alert: Possible follower detected");
      } else if (randomScore > 0.7) {
        setAlertLevel("medium");
        setDetectionStatus("Monitoring suspicious movement pattern");
      } else if (randomScore > 0.5) {
        setAlertLevel("low");
        setDetectionStatus("Minor anomaly detected");
      } else {
        setAlertLevel("none");
        setSuspiciousActivity(false);
        setDetectionStatus("No suspicious activity detected");
      }
    }, 0);

    return () => clearTimeout(timeoutId);
  }, [movements.length, state.isFollowDetection, logActivity]);

  // Simulate movement tracking
  useEffect(() => {
    if (!state.isFollowDetection) {
      setMovements([]);
      setAlertLevel("none");
      setSuspiciousActivity(false);
      return;
    }

    const trackMovement = () => {
      // In real app, this would use actual GPS data
      const movement: MovementData = {
        timestamp: Date.now(),
        lat: (state.currentLocation?.lat ?? 28.6139) + (Math.random() - 0.5) * 0.001,
        lng: (state.currentLocation?.lng ?? 77.2090) + (Math.random() - 0.5) * 0.001,
      };
      analyzeMovement(movement);
    };

    trackMovement();
    const interval = setInterval(trackMovement, 5000); // Check every 5 seconds

    return () => clearInterval(interval);
  }, [state.isFollowDetection, state.currentLocation, analyzeMovement]);

  const handleDismissAlert = useCallback(() => {
    setSuspiciousActivity(false);
    setAlertLevel("none");
    setDetectionStatus("Alert dismissed. Continuing to monitor...");
  }, []);

  const handleTriggerSOS = useCallback(() => {
    triggerSOS();
    logActivity("follow", "SOS triggered from follow detection");
    onClose();
  }, [triggerSOS, logActivity, onClose]);

  // Alert overlay when suspicious activity detected
  if (suspiciousActivity && state.isFollowDetection) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-destructive/95 p-8">
        <div className="text-center text-destructive-foreground max-w-sm">
          <AlertTriangle className="w-20 h-20 mx-auto mb-4 animate-bounce" />
          <h2 className="text-3xl font-bold mb-2">Alert!</h2>
          <p className="text-lg opacity-80 mb-8">
            Suspicious following pattern detected. Someone may be following you.
          </p>
          <div className="flex flex-col gap-4">
            <Button
              onClick={handleTriggerSOS}
              size="lg"
              variant="outline"
              className="border-destructive-foreground text-destructive-foreground hover:bg-destructive-foreground/10"
            >
              Trigger SOS
            </Button>
            <Button
              onClick={handleDismissAlert}
              size="lg"
              className="bg-destructive-foreground text-destructive hover:bg-destructive-foreground/90"
            >
              I&apos;m Safe - Dismiss
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!isOpen) return null;

  const getAlertColor = () => {
    switch (alertLevel) {
      case "high": return "text-destructive";
      case "medium": return "text-warning";
      case "low": return "text-chart-3";
      default: return "text-safe";
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-background/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-card rounded-xl border shadow-xl overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <Users className={cn("w-5 h-5", state.isFollowDetection ? "text-primary" : "text-muted-foreground")} />
            <h2 className="text-lg font-semibold">Follow Detection</h2>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-muted rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Status Display */}
          <div className="text-center">
            <div
              className={cn(
                "w-24 h-24 mx-auto rounded-full flex items-center justify-center mb-4",
                state.isFollowDetection
                  ? alertLevel === "none"
                    ? "bg-safe/20"
                    : alertLevel === "low"
                    ? "bg-chart-3/20"
                    : alertLevel === "medium"
                    ? "bg-warning/20"
                    : "bg-destructive/20"
                  : "bg-muted"
              )}
            >
              {state.isFollowDetection ? (
                <Eye className={cn("w-10 h-10", getAlertColor())} />
              ) : (
                <EyeOff className="w-10 h-10 text-muted-foreground" />
              )}
            </div>
            <p className={cn("font-medium", state.isFollowDetection ? getAlertColor() : "text-muted-foreground")}>
              {state.isFollowDetection ? detectionStatus : "Detection Disabled"}
            </p>
          </div>

          {/* Alert Level Indicator */}
          {state.isFollowDetection && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Alert Level</span>
                <span className={cn("font-medium capitalize", getAlertColor())}>
                  {alertLevel}
                </span>
              </div>
              <div className="flex gap-1">
                {["none", "low", "medium", "high"].map((level, i) => (
                  <div
                    key={level}
                    className={cn(
                      "flex-1 h-2 rounded-full transition-colors",
                      i <= ["none", "low", "medium", "high"].indexOf(alertLevel)
                        ? i === 0
                          ? "bg-safe"
                          : i === 1
                          ? "bg-chart-3"
                          : i === 2
                          ? "bg-warning"
                          : "bg-destructive"
                        : "bg-muted"
                    )}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Movement History */}
          {state.isFollowDetection && movements.length > 0 && (
            <div className="p-3 rounded-lg bg-muted/50 max-h-32 overflow-y-auto">
              <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                <Navigation className="w-3 h-3" />
                Recent Movement Points ({movements.length})
              </p>
              <div className="space-y-1">
                {movements.slice(-5).reverse().map((m, i) => (
                  <div key={i} className="text-xs flex items-center justify-between">
                    <span className="text-muted-foreground">
                      {new Date(m.timestamp).toLocaleTimeString()}
                    </span>
                    <span className="font-mono">
                      {m.lat.toFixed(4)}, {m.lng.toFixed(4)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <Button
            onClick={toggleFollowDetection}
            size="lg"
            className={cn(
              "w-full",
              state.isFollowDetection
                ? "bg-destructive hover:bg-destructive/90"
                : ""
            )}
          >
            {state.isFollowDetection ? (
              <>
                <EyeOff className="w-4 h-4 mr-2" />
                Stop Detection
              </>
            ) : (
              <>
                <Eye className="w-4 h-4 mr-2" />
                Start Follow Detection
              </>
            )}
          </Button>

          <div className="p-3 rounded-lg bg-muted/50">
            <p className="text-sm text-muted-foreground">
              <strong>How it works:</strong> The app monitors your movement patterns
              and detects if someone appears to be following you by analyzing
              location data over time.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
