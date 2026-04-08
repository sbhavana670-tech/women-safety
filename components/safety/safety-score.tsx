"use client";

import { useState, useEffect } from "react";
import { useSafety } from "@/lib/safety-context";
import { cn } from "@/lib/utils";
import { Shield, TrendingUp, TrendingDown } from "lucide-react";

export function SafetyScore() {
  const { state } = useSafety();
  const score = state.dailySafetyScore;
  const [mounted, setMounted] = useState(false);
  const [trend, setTrend] = useState<"up" | "down">("up");
  const [trendValue, setTrendValue] = useState(5);

  // Only show trend after mount to avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
    const isUp = Math.random() > 0.5;
    setTrend(isUp ? "up" : "down");
    setTrendValue(isUp ? Math.floor(Math.random() * 5) + 1 : Math.floor(Math.random() * 3) + 1);
  }, []);

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-safe";
    if (score >= 60) return "text-warning";
    if (score >= 40) return "text-chart-3";
    return "text-destructive";
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return "Excellent";
    if (score >= 60) return "Good";
    if (score >= 40) return "Fair";
    return "Low";
  };

  return (
    <div className="p-4 rounded-xl bg-card border">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-primary" />
          <h3 className="font-semibold">Daily Safety Score</h3>
        </div>
        {mounted && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            {trend === "up" ? (
              <>
                <TrendingUp className="w-3 h-3 text-safe" />
                <span className="text-safe">+{trendValue}%</span>
              </>
            ) : (
              <>
                <TrendingDown className="w-3 h-3 text-destructive" />
                <span className="text-destructive">-{trendValue}%</span>
              </>
            )}
          </div>
        )}
      </div>

      <div className="flex items-end gap-4">
        <div className="relative w-24 h-24">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
            {/* Background circle */}
            <circle
              cx="50"
              cy="50"
              r="40"
              fill="none"
              stroke="currentColor"
              strokeWidth="8"
              className="text-muted"
            />
            {/* Progress circle */}
            <circle
              cx="50"
              cy="50"
              r="40"
              fill="none"
              stroke="currentColor"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={`${(score / 100) * 251} 251`}
              className={getScoreColor(score)}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={cn("text-2xl font-bold", getScoreColor(score))}>
              {score}
            </span>
          </div>
        </div>

        <div className="flex-1 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Status</span>
            <span className={cn("text-sm font-medium", getScoreColor(score))}>
              {getScoreLabel(score)}
            </span>
          </div>
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Location Safety</span>
              <span>92%</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Time of Day</span>
              <span>78%</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Route Safety</span>
              <span>85%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
