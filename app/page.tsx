"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Shield,
  ArrowRight,
  Phone,
  MapPin,
  Mic,
  AlertTriangle,
  Clock,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/auth-store";

export default function Home() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    const user = getCurrentUser();

    if (user) {
      router.replace("/dashboard"); // ✅ use replace instead of push
    }
  }, [router]);

  if (!mounted) return null;

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-background via-background to-primary/10">
      
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/20 rounded-full blur-3xl animate-pulse" />
        <div
          className="absolute top-40 right-20 w-96 h-96 bg-safe/15 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "1s" }}
        />
        <div
          className="absolute bottom-20 left-1/3 w-80 h-80 bg-destructive/10 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "2s" }}
        />
      </div>

      {/* Grid Pattern */}
      <div
        className="absolute inset-0 opacity-[0.015]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(139,92,246,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(139,92,246,0.5) 1px, transparent 1px)",
          backgroundSize: "50px 50px",
        }}
      />

      {/* Logo Background */}
      <div
        className="absolute inset-0 opacity-[0.05] pointer-events-none bg-center bg-no-repeat z-0"
        style={{
          backgroundImage:
            "url('https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-vP76vXsAPqObxnESlFV4UTfxsJIMPE.png')",
          backgroundSize: "35%",
        }}
      />

      <div className="relative z-10 min-h-screen flex flex-col">
        
        {/* Header */}
        <header className="p-6">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl overflow-hidden shadow-lg shadow-primary/30 bg-white p-1">
                <img
                  src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-vP76vXsAPqObxnESlFV4UTfxsJIMPE.png"
                  alt="Women Safety App"
                  className="w-full h-full object-contain"
                />
              </div>
              <div>
                <span className="text-xl font-bold text-foreground">
                  Women Safety
                </span>
                <p className="text-xs text-muted-foreground">
                  Violence Against Women - Never Again
                </p>
              </div>
            </div>

            {/* Auth Buttons */}
            <div className="flex items-center gap-3">
              <Link href="/login">
                <Button variant="ghost">Sign In</Button>
              </Link>
              <Link href="/register">
                <Button className="bg-gradient-to-r from-primary to-primary/80">
                  Get Started
                </Button>
              </Link>
            </div>
          </div>
        </header>

        {/* Hero Section */}
        <main className="flex-1 flex items-center justify-center p-6">
          <div className="max-w-4xl mx-auto text-center">
            
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-8">
              <AlertTriangle className="w-4 h-4" />
              Your Safety is Our Priority
            </div>

            <h1 className="text-5xl md:text-7xl font-bold mb-6">
              Stay Safe with{" "}
              <span className="bg-gradient-to-r from-primary via-destructive to-safe bg-clip-text text-transparent">
                SafeGuard
              </span>
            </h1>

            <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
              SOS alerts, live tracking, voice detection, and emergency calls —
              all in one safety platform designed to protect you instantly.
            </p>

            <div className="flex items-center justify-center gap-4">
              <Link href="/register">
                <Button
                  size="lg"
                  className="h-14 px-8 text-lg bg-gradient-to-r from-primary to-primary/80"
                >
                  Get Started Free
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>

              <Link href="/login">
                <Button size="lg" variant="outline" className="h-14 px-8 text-lg">
                  Sign In
                </Button>
              </Link>
            </div>

            {/* Features */}
            <div className="mt-20 grid grid-cols-2 md:grid-cols-3 gap-6">
              {[
                { icon: Phone, label: "SOS Alerts", desc: "One-tap emergency" },
                { icon: MapPin, label: "Live Tracking", desc: "Real-time location" },
                { icon: Mic, label: "Voice Trigger", desc: "Hands-free SOS" },
                { icon: Users, label: "Safe Contacts", desc: "Instant alerts" },
                { icon: Clock, label: "Safety Timer", desc: "Check-in alerts" },
                { icon: Shield, label: "Crime Heatmap", desc: "Safe route finder" },
              ].map((feature) => (
                <div
                  key={feature.label}
                  className="p-6 rounded-2xl bg-card/50 border hover:border-primary/30 transition hover:scale-105"
                >
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 mx-auto">
                    <feature.icon className="w-6 h-6" />
                  </div>
                  <h3 className="font-semibold mb-1">{feature.label}</h3>
                  <p className="text-sm text-muted-foreground">
                    {feature.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="p-6 text-center text-sm text-muted-foreground">
          Women Safety App - Violence Against Women, Never Again
        </footer>
      </div>
    </div>
  );
}