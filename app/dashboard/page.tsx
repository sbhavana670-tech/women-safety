"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getCurrentUser, setCurrentUser, getUsageStats, type UsageStats } from "@/lib/auth-store";
import { SafetyProvider } from "@/lib/safety-context";
import { SafetyDashboard } from "@/components/safety/safety-dashboard";
import { LogOut, User, Shield, Activity, MessageSquare, Phone, Timer } from "lucide-react";

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<ReturnType<typeof getCurrentUser>>(null);
  const [stats, setStats] = useState<UsageStats | null>(null);
  const [mounted, setMounted] = useState(false);
  const [showStats, setShowStats] = useState(false);

  useEffect(() => {
    setMounted(true);
    const currentUser = getCurrentUser();
    if (!currentUser) {
      router.push("/login");
      return;
    }
    setUser(currentUser);
    setStats(getUsageStats());
  }, [router]);

  const handleLogout = () => {
    setCurrentUser(null);
    router.push("/login");
  };

  if (!mounted || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <SafetyProvider>
      <div className="min-h-screen relative">
        {/* Background image overlay */}
        <div 
          className="fixed inset-0 bg-cover bg-center bg-no-repeat opacity-[0.08] pointer-events-none"
          style={{
            backgroundImage: `url("/images/women-safety-bg.jpg")`,
          }}
        />
        <div className="fixed inset-0 bg-gradient-to-b from-background via-background/95 to-background pointer-events-none" />
        
        {/* Header */}
        <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50">
          <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
                <Shield className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="font-bold text-foreground">SafeGuard</h1>
                <p className="text-xs text-muted-foreground">Welcome, {user.name.split(" ")[0]}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowStats(!showStats)}
                className="p-2 rounded-lg hover:bg-muted transition-colors"
                title="View Statistics"
              >
                <Activity className="w-5 h-5 text-muted-foreground" />
              </button>
              <button
                onClick={handleLogout}
                className="p-2 rounded-lg hover:bg-destructive/10 text-destructive transition-colors"
                title="Logout"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </header>

        {/* Stats Panel */}
        {showStats && stats && (
          <div className="max-w-lg mx-auto px-4 py-4 animate-fade-in">
            <div className="bg-card/80 backdrop-blur-xl rounded-2xl border border-border/50 p-4">
              <h2 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                <Activity className="w-5 h-5 text-primary" />
                Usage Statistics
              </h2>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20">
                  <div className="flex items-center gap-2 text-destructive mb-1">
                    <Shield className="w-4 h-4" />
                    <span className="text-xs font-medium">SOS Activations</span>
                  </div>
                  <p className="text-2xl font-bold text-destructive">{stats.sosActivations}</p>
                </div>
                <div className="p-3 rounded-xl bg-safe/10 border border-safe/20">
                  <div className="flex items-center gap-2 text-safe mb-1">
                    <MessageSquare className="w-4 h-4" />
                    <span className="text-xs font-medium">SMS Sent</span>
                  </div>
                  <p className="text-2xl font-bold text-safe">{stats.smsSent}</p>
                </div>
                <div className="p-3 rounded-xl bg-primary/10 border border-primary/20">
                  <div className="flex items-center gap-2 text-primary mb-1">
                    <Phone className="w-4 h-4" />
                    <span className="text-xs font-medium">Calls Made</span>
                  </div>
                  <p className="text-2xl font-bold text-primary">{stats.callsMade}</p>
                </div>
                <div className="p-3 rounded-xl bg-warning/10 border border-warning/20">
                  <div className="flex items-center gap-2 text-warning mb-1">
                    <Timer className="w-4 h-4" />
                    <span className="text-xs font-medium">Timer Usage</span>
                  </div>
                  <p className="text-2xl font-bold text-warning">{stats.timerUsage}</p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-3 text-center">
                Last active: {new Date(stats.lastActive).toLocaleString()}
              </p>
            </div>
          </div>
        )}

        {/* User info card */}
        <div className="max-w-lg mx-auto px-4 py-4">
          <div className="bg-gradient-to-r from-primary/10 to-safe/10 rounded-2xl p-4 border border-primary/20">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                <User className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-foreground">{user.name}</p>
                <p className="text-sm text-muted-foreground">{user.email}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Member since</p>
                <p className="text-sm font-medium text-foreground">
                  {new Date(user.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Safety Dashboard */}
        <SafetyDashboard />
      </div>
    </SafetyProvider>
  );
}
