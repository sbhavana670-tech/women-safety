"use client";

import { useEffect, useState } from "react";
import { useSafety } from "@/lib/safety-context";
import { Battery, BatteryLow, BatteryWarning, BatteryCharging, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface BatteryManager extends EventTarget {
  charging: boolean;
  chargingTime: number;
  dischargingTime: number;
  level: number;
}

declare global {
  interface Navigator {
    getBattery?: () => Promise<BatteryManager>;
  }
}

export function BatteryMonitor() {
  const { state, settings, logActivity } = useSafety();
  const [batteryLevel, setBatteryLevel] = useState(state.batteryLevel);
  const [isCharging, setIsCharging] = useState(false);
  const [showWarning, setShowWarning] = useState(false);

  useEffect(() => {
    const updateBattery = async () => {
      if ("getBattery" in navigator && navigator.getBattery) {
        try {
          const battery = await navigator.getBattery();
          setBatteryLevel(Math.round(battery.level * 100));
          setIsCharging(battery.charging);

          battery.addEventListener("levelchange", () => {
            const newLevel = Math.round(battery.level * 100);
            setBatteryLevel(newLevel);
            
            if (newLevel <= settings.lowBatteryThreshold && !isCharging) {
              setShowWarning(true);
              logActivity("battery", `Low battery warning: ${newLevel}%`);
            }
          });

          battery.addEventListener("chargingchange", () => {
            setIsCharging(battery.charging);
          });
        } catch {
          // Battery API not available, simulate
          simulateBattery();
        }
      } else {
        // Simulate battery for demo
        simulateBattery();
      }
    };

    const simulateBattery = () => {
      // Simulate battery for demo purposes
      const simLevel = Math.floor(Math.random() * 60) + 40;
      setBatteryLevel(simLevel);
      if (simLevel <= settings.lowBatteryThreshold) {
        setShowWarning(true);
      }
    };

    updateBattery();
  }, [settings.lowBatteryThreshold, isCharging, logActivity]);

  const getBatteryIcon = () => {
    if (isCharging) return BatteryCharging;
    if (batteryLevel <= 10) return BatteryLow;
    if (batteryLevel <= 20) return BatteryWarning;
    return Battery;
  };

  const getBatteryColor = () => {
    if (batteryLevel <= 10) return "text-destructive";
    if (batteryLevel <= 20) return "text-warning";
    if (batteryLevel <= 50) return "text-chart-3";
    return "text-safe";
  };

  const BatteryIcon = getBatteryIcon();

  return (
    <div className="relative">
      <div className="flex items-center gap-2 p-3 rounded-lg bg-card border">
        <BatteryIcon className={cn("w-5 h-5", getBatteryColor())} />
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">{batteryLevel}%</span>
            {isCharging && (
              <span className="text-xs text-safe">Charging</span>
            )}
          </div>
          <div className="w-full h-2 bg-muted rounded-full mt-1 overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all",
                batteryLevel <= 10
                  ? "bg-destructive"
                  : batteryLevel <= 20
                  ? "bg-warning"
                  : batteryLevel <= 50
                  ? "bg-chart-3"
                  : "bg-safe"
              )}
              style={{ width: `${batteryLevel}%` }}
            />
          </div>
        </div>
      </div>

      {/* Low battery warning overlay */}
      {showWarning && batteryLevel <= settings.lowBatteryThreshold && (
        <div className="absolute inset-0 flex items-center justify-center bg-destructive/10 backdrop-blur-sm rounded-lg border border-destructive/30">
          <div className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="w-4 h-4 animate-pulse" />
            <span className="text-sm font-medium">Low Battery!</span>
          </div>
          <button
            onClick={() => setShowWarning(false)}
            className="absolute top-1 right-1 text-xs text-muted-foreground hover:text-foreground"
          >
            Dismiss
          </button>
        </div>
      )}
    </div>
  );
}
