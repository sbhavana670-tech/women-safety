"use client";

import { useSafety } from "@/lib/safety-context";
import { cn } from "@/lib/utils";
import { AlertTriangle, CheckCircle, AlertCircle, ShieldAlert } from "lucide-react";

const riskConfig = {
  low: {
    label: "Low Risk",
    color: "text-safe",
    bgColor: "bg-safe/10",
    borderColor: "border-safe/30",
    icon: CheckCircle,
    description: "Area appears safe. Stay alert.",
  },
  medium: {
    label: "Medium Risk",
    color: "text-warning",
    bgColor: "bg-warning/10",
    borderColor: "border-warning/30",
    icon: AlertCircle,
    description: "Exercise caution in this area.",
  },
  high: {
    label: "High Risk",
    color: "text-chart-3",
    bgColor: "bg-chart-3/10",
    borderColor: "border-chart-3/30",
    icon: AlertTriangle,
    description: "High alert. Consider leaving.",
  },
  critical: {
    label: "Critical",
    color: "text-destructive",
    bgColor: "bg-destructive/10",
    borderColor: "border-destructive/30",
    icon: ShieldAlert,
    description: "Immediate danger. Seek help now.",
  },
};

export function RiskIndicator({ compact = false }: { compact?: boolean }) {
  const { state } = useSafety();
  const config = riskConfig[state.riskLevel];
  const Icon = config.icon;

  if (compact) {
    return (
      <div
        className={cn(
          "flex items-center gap-2 px-3 py-1.5 rounded-full",
          config.bgColor,
          config.borderColor,
          "border"
        )}
      >
        <Icon className={cn("w-4 h-4", config.color)} />
        <span className={cn("text-sm font-medium", config.color)}>
          {config.label}
        </span>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "p-4 rounded-xl border",
        config.bgColor,
        config.borderColor
      )}
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            "p-2 rounded-lg",
            config.bgColor
          )}
        >
          <Icon className={cn("w-6 h-6", config.color)} />
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <h3 className={cn("font-semibold", config.color)}>
              {config.label}
            </h3>
            <RiskMeter level={state.riskLevel} />
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {config.description}
          </p>
        </div>
      </div>
    </div>
  );
}

function RiskMeter({ level }: { level: string }) {
  const levels = ["low", "medium", "high", "critical"];
  const currentIndex = levels.indexOf(level);

  return (
    <div className="flex gap-1">
      {levels.map((l, i) => (
        <div
          key={l}
          className={cn(
            "w-2 h-4 rounded-sm transition-colors",
            i <= currentIndex
              ? i === 0
                ? "bg-safe"
                : i === 1
                ? "bg-warning"
                : i === 2
                ? "bg-chart-3"
                : "bg-destructive"
              : "bg-muted"
          )}
        />
      ))}
    </div>
  );
}
