"use client";

import { useMemo } from "react";
import { useSafety } from "@/lib/safety-context";
import {
  Clock,
  AlertTriangle,
  Mic,
  Lock,
  Timer,
  MapPin,
  Camera,
  Bell,
  Phone,
  Users,
  Battery,
  Flashlight,
  FileText,
  Trash2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ActivityLogProps {
  isOpen: boolean;
  onClose: () => void;
}

const iconMap = {
  sos: AlertTriangle,
  voice: Mic,
  pin: Lock,
  timer: Timer,
  location: MapPin,
  evidence: Camera,
  alarm: Bell,
  fake_call: Phone,
  follow: Users,
  battery: Battery,
  flashlight: Flashlight,
  complaint: FileText,
};

const colorMap = {
  sos: "text-destructive bg-destructive/10",
  voice: "text-primary bg-primary/10",
  pin: "text-chart-4 bg-chart-4/10",
  timer: "text-warning bg-warning/10",
  location: "text-safe bg-safe/10",
  evidence: "text-chart-1 bg-chart-1/10",
  alarm: "text-destructive bg-destructive/10",
  fake_call: "text-chart-2 bg-chart-2/10",
  follow: "text-chart-5 bg-chart-5/10",
  battery: "text-warning bg-warning/10",
  flashlight: "text-warning bg-warning/10",
  complaint: "text-chart-3 bg-chart-3/10",
};

export function ActivityLog({ isOpen, onClose }: ActivityLogProps) {
  const { logs, clearActivityLogs } = useSafety();

  const groupedLogs = useMemo(() => {
    const groups: Record<string, typeof logs> = {};
    
    logs.forEach((log) => {
      const date = new Date(log.timestamp).toLocaleDateString();
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(log);
    });

    return groups;
  }, [logs]);

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return "Today";
    }
    if (date.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    }
    return date.toLocaleDateString(undefined, {
      weekday: "long",
      month: "short",
      day: "numeric",
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-background/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg bg-card rounded-xl border shadow-xl overflow-hidden max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b shrink-0">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-muted-foreground" />
            <h2 className="text-lg font-semibold">Activity Log</h2>
            <span className="text-xs text-muted-foreground">
              ({logs.length} events)
            </span>
          </div>
          <div className="flex items-center gap-2">
            {logs.length > 0 && (
              <Button
                size="sm"
                variant="ghost"
                onClick={clearActivityLogs}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
            <button onClick={onClose} className="p-1 hover:bg-muted rounded-lg">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {logs.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No activity recorded yet</p>
              <p className="text-sm">Your safety activities will appear here.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedLogs).map(([date, dayLogs]) => (
                <div key={date}>
                  <div className="sticky top-0 bg-card py-2 z-10">
                    <h3 className="text-sm font-medium text-muted-foreground">
                      {formatDate(date)}
                    </h3>
                  </div>
                  <div className="space-y-2">
                    {dayLogs.map((log) => {
                      const Icon = iconMap[log.type] || Clock;
                      const colors = colorMap[log.type] || "text-muted-foreground bg-muted";

                      return (
                        <div
                          key={log.id}
                          className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors"
                        >
                          <div
                            className={cn(
                              "p-2 rounded-lg shrink-0",
                              colors.split(" ")[1]
                            )}
                          >
                            <Icon
                              className={cn("w-4 h-4", colors.split(" ")[0])}
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium">
                              {log.description}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {formatTime(log.timestamp)}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-4 border-t bg-muted/30 shrink-0">
          <p className="text-xs text-muted-foreground text-center">
            Activity logs are stored locally and encrypted. They can be used as
            evidence if needed.
          </p>
        </div>
      </div>
    </div>
  );
}
