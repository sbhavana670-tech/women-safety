"use client";

import { useSafety } from "@/lib/safety-context";
import { cn } from "@/lib/utils";
import {
  Phone,
  MapPin,
  Mic,
  Timer,
  Eye,
  Flashlight,
  Camera,
  FileText,
  Bell,
  Lock,
  Users,
  MessageSquare,
  Map,
} from "lucide-react";

interface QuickAction {
  id: string;
  label: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  onClick: () => void;
  active?: boolean;
}

interface QuickActionsProps {
  onOpenFakeCall: () => void;
  onOpenTimer: () => void;
  onOpenAlarm: () => void;
  onOpenPinTrigger: () => void;
  onOpenEvidence: () => void;
  onOpenComplaint: () => void;
  onOpenSafePlaces: () => void;
  onOpenFlashlight: () => void;
  onOpenSMSTester: () => void;
  onOpenLiveMap: () => void;
}

export function QuickActions({
  onOpenFakeCall,
  onOpenTimer,
  onOpenAlarm,
  onOpenPinTrigger,
  onOpenEvidence,
  onOpenComplaint,
  onOpenSafePlaces,
  onOpenFlashlight,
  onOpenSMSTester,
  onOpenLiveMap,
}: QuickActionsProps) {
  const {
    state,
    toggleVoiceDetection,
    toggleStealth,
    toggleFollowDetection,
  } = useSafety();

  const actions: QuickAction[] = [
    {
      id: "fake-call",
      label: "Fake Call",
      icon: Phone,
      color: "text-chart-2",
      bgColor: "bg-chart-2/10 hover:bg-chart-2/20",
      onClick: onOpenFakeCall,
    },
    {
      id: "safe-places",
      label: "Safe Places",
      icon: MapPin,
      color: "text-safe",
      bgColor: "bg-safe/10 hover:bg-safe/20",
      onClick: onOpenSafePlaces,
    },
    {
      id: "voice-trigger",
      label: "Voice SOS",
      icon: Mic,
      color: state.isVoiceDetectionActive ? "text-primary" : "text-muted-foreground",
      bgColor: state.isVoiceDetectionActive ? "bg-primary/20" : "bg-muted hover:bg-muted/80",
      onClick: toggleVoiceDetection,
      active: state.isVoiceDetectionActive,
    },
    {
      id: "timer",
      label: "Safety Timer",
      icon: Timer,
      color: state.isTimerActive ? "text-warning" : "text-muted-foreground",
      bgColor: state.isTimerActive ? "bg-warning/20" : "bg-muted hover:bg-muted/80",
      onClick: onOpenTimer,
      active: state.isTimerActive,
    },
    {
      id: "stealth",
      label: "Stealth Mode",
      icon: Eye,
      color: state.isStealthMode ? "text-chart-5" : "text-muted-foreground",
      bgColor: state.isStealthMode ? "bg-chart-5/20" : "bg-muted hover:bg-muted/80",
      onClick: toggleStealth,
      active: state.isStealthMode,
    },
    {
      id: "follow",
      label: "Follow Detect",
      icon: Users,
      color: state.isFollowDetection ? "text-chart-4" : "text-muted-foreground",
      bgColor: state.isFollowDetection ? "bg-chart-4/20" : "bg-muted hover:bg-muted/80",
      onClick: toggleFollowDetection,
      active: state.isFollowDetection,
    },
    {
      id: "flashlight",
      label: "Flashlight",
      icon: Flashlight,
      color: "text-warning",
      bgColor: "bg-warning/10 hover:bg-warning/20",
      onClick: onOpenFlashlight,
    },
    {
      id: "evidence",
      label: "Capture",
      icon: Camera,
      color: "text-chart-1",
      bgColor: "bg-chart-1/10 hover:bg-chart-1/20",
      onClick: onOpenEvidence,
    },
    {
      id: "complaint",
      label: "Complaint",
      icon: FileText,
      color: "text-chart-3",
      bgColor: "bg-chart-3/10 hover:bg-chart-3/20",
      onClick: onOpenComplaint,
    },
    {
      id: "alarm",
      label: "Alarm",
      icon: Bell,
      color: "text-destructive",
      bgColor: "bg-destructive/10 hover:bg-destructive/20",
      onClick: onOpenAlarm,
    },
    {
      id: "pin-trigger",
      label: "PIN Trigger",
      icon: Lock,
      color: "text-primary",
      bgColor: "bg-primary/10 hover:bg-primary/20",
      onClick: onOpenPinTrigger,
    },
    {
      id: "sms-test",
      label: "Test SMS",
      icon: MessageSquare,
      color: "text-safe",
      bgColor: "bg-safe/10 hover:bg-safe/20",
      onClick: onOpenSMSTester,
    },
    {
      id: "live-map",
      label: "Live Map",
      icon: Map,
      color: "text-chart-2",
      bgColor: "bg-chart-2/10 hover:bg-chart-2/20",
      onClick: onOpenLiveMap,
    },
  ];

  return (
    <div className="grid grid-cols-4 gap-3">
      {actions.map((action) => (
        <button
          key={action.id}
          onClick={action.onClick}
          className={cn(
            "flex flex-col items-center justify-center p-3 rounded-xl transition-all",
            "active:scale-95",
            action.bgColor,
            action.active && "ring-2 ring-offset-2 ring-offset-background",
            action.active && action.id === "voice-trigger" && "ring-primary",
            action.active && action.id === "timer" && "ring-warning",
            action.active && action.id === "stealth" && "ring-chart-5",
            action.active && action.id === "follow" && "ring-chart-4"
          )}
        >
          <action.icon className={cn("w-6 h-6 mb-1", action.color)} />
          <span className="text-xs font-medium text-center leading-tight">
            {action.label}
          </span>
        </button>
      ))}
    </div>
  );
}
