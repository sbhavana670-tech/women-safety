"use client";

import { useState } from "react";
import { useSafety } from "@/lib/safety-context";
import {
  Settings,
  X,
  AlertTriangle,
  Mic,
  MapPin,
  Battery,
  Volume2,
  Eye,
  ChevronDown,
  ChevronUp,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface DemoControlsProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DemoControls({ isOpen, onClose }: DemoControlsProps) {
  const {
    state,
    setRiskLevel,
    updateLocation,
    triggerSOS,
    cancelSOS,
    toggleVoiceDetection,
    toggleFollowDetection,
    toggleStealth,
    dispatch,
    logActivity,
  } = useSafety();

  const [isExpanded, setIsExpanded] = useState(true);

  const simulateVoiceTrigger = () => {
    logActivity("voice", "Simulated voice trigger: 'Help!'");
    triggerSOS();
  };

  const simulateLowBattery = () => {
    dispatch({ type: "SET_BATTERY", payload: 15 });
    logActivity("battery", "Simulated low battery: 15%");
  };

  const simulateFollowDetection = () => {
    if (!state.isFollowDetection) {
      toggleFollowDetection();
    }
    logActivity("follow", "Simulated follow detection alert");
  };

  const resetSimulation = () => {
    cancelSOS();
    setRiskLevel("low");
    dispatch({ type: "SET_BATTERY", payload: 85 });
    updateLocation(28.6139, 77.2090);
    if (state.isFollowDetection) toggleFollowDetection();
    if (state.isVoiceDetectionActive) toggleVoiceDetection();
    if (state.isStealthMode) toggleStealth();
    logActivity("sos", "Simulation reset to default state");
  };

  const riskLevels: Array<{ level: typeof state.riskLevel; label: string; color: string }> = [
    { level: "low", label: "Low", color: "bg-safe text-safe-foreground" },
    { level: "medium", label: "Medium", color: "bg-warning text-warning-foreground" },
    { level: "high", label: "High", color: "bg-chart-3 text-foreground" },
    { level: "critical", label: "Critical", color: "bg-destructive text-destructive-foreground" },
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-4 right-4 z-40 w-80">
      <div className="bg-card rounded-xl border shadow-xl overflow-hidden">
        {/* Header */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-chart-4" />
            <h3 className="font-semibold">Demo Controls</h3>
          </div>
          <div className="flex items-center gap-2">
            {isExpanded ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronUp className="w-4 h-4" />
            )}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
              className="p-1 hover:bg-muted rounded-lg"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </button>

        {/* Content */}
        {isExpanded && (
          <div className="p-4 pt-0 space-y-4">
            {/* Risk Level */}
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-2 block">
                Risk Level
              </label>
              <div className="grid grid-cols-4 gap-1">
                {riskLevels.map((r) => (
                  <button
                    key={r.level}
                    onClick={() => setRiskLevel(r.level)}
                    className={cn(
                      "py-1.5 px-2 rounded-lg text-xs font-medium transition-all",
                      state.riskLevel === r.level
                        ? r.color
                        : "bg-muted hover:bg-muted/80"
                    )}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Quick Simulations */}
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-2 block">
                Quick Simulations
              </label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={state.isSOSActive ? cancelSOS : triggerSOS}
                  className={cn(
                    state.isSOSActive && "border-destructive text-destructive"
                  )}
                >
                  <AlertTriangle className="w-3 h-3 mr-1" />
                  {state.isSOSActive ? "Cancel SOS" : "Trigger SOS"}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={simulateVoiceTrigger}
                >
                  <Mic className="w-3 h-3 mr-1" />
                  Voice Trigger
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={simulateLowBattery}
                >
                  <Battery className="w-3 h-3 mr-1" />
                  Low Battery
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={simulateFollowDetection}
                >
                  <Eye className="w-3 h-3 mr-1" />
                  Follow Alert
                </Button>
              </div>
            </div>

            {/* Location Simulation */}
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-2 block">
                Simulate Location
              </label>
              <div className="grid grid-cols-3 gap-1">
                {[
                  { name: "Delhi", lat: 28.6139, lng: 77.2090 },
                  { name: "Mumbai", lat: 19.0760, lng: 72.8777 },
                  { name: "Bangalore", lat: 12.9716, lng: 77.5946 },
                ].map((city) => (
                  <button
                    key={city.name}
                    onClick={() => {
                      updateLocation(city.lat, city.lng);
                      logActivity("location", `Simulated location: ${city.name}`);
                    }}
                    className="py-1.5 px-2 rounded-lg text-xs bg-muted hover:bg-muted/80 transition-colors flex items-center justify-center gap-1"
                  >
                    <MapPin className="w-3 h-3" />
                    {city.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Feature Toggles */}
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-2 block">
                Feature Toggles
              </label>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm flex items-center gap-2">
                    <Mic className="w-3 h-3" />
                    Voice Detection
                  </span>
                  <button
                    onClick={toggleVoiceDetection}
                    className={cn(
                      "w-10 h-5 rounded-full transition-colors",
                      state.isVoiceDetectionActive
                        ? "bg-primary"
                        : "bg-muted"
                    )}
                  >
                    <div
                      className={cn(
                        "w-4 h-4 rounded-full bg-white shadow transition-transform",
                        state.isVoiceDetectionActive
                          ? "translate-x-5"
                          : "translate-x-0.5"
                      )}
                    />
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm flex items-center gap-2">
                    <Eye className="w-3 h-3" />
                    Follow Detection
                  </span>
                  <button
                    onClick={toggleFollowDetection}
                    className={cn(
                      "w-10 h-5 rounded-full transition-colors",
                      state.isFollowDetection
                        ? "bg-primary"
                        : "bg-muted"
                    )}
                  >
                    <div
                      className={cn(
                        "w-4 h-4 rounded-full bg-white shadow transition-transform",
                        state.isFollowDetection
                          ? "translate-x-5"
                          : "translate-x-0.5"
                      )}
                    />
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm flex items-center gap-2">
                    <Volume2 className="w-3 h-3" />
                    Stealth Mode
                  </span>
                  <button
                    onClick={toggleStealth}
                    className={cn(
                      "w-10 h-5 rounded-full transition-colors",
                      state.isStealthMode
                        ? "bg-primary"
                        : "bg-muted"
                    )}
                  >
                    <div
                      className={cn(
                        "w-4 h-4 rounded-full bg-white shadow transition-transform",
                        state.isStealthMode
                          ? "translate-x-5"
                          : "translate-x-0.5"
                      )}
                    />
                  </button>
                </div>
              </div>
            </div>

            {/* Reset */}
            <Button
              variant="outline"
              size="sm"
              onClick={resetSimulation}
              className="w-full"
            >
              <RotateCcw className="w-3 h-3 mr-1" />
              Reset All
            </Button>

            <p className="text-xs text-muted-foreground text-center">
              These controls are for demo purposes only.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
