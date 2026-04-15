"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  getCurrentUser,
  setCurrentUser,
  getUsageStats,
  type UsageStats,
} from "@/lib/auth-store";
import { SafetyProvider } from "@/lib/safety-context";
import { SafetyDashboard } from "@/components/safety/safety-dashboard";
import { LogOut, Activity, MapPin, Mic } from "lucide-react";

export default function DashboardPage() {
  const router = useRouter();

  const [user, setUser] = useState<ReturnType<typeof getCurrentUser>>(null);
  const [stats, setStats] = useState<UsageStats | null>(null);
  const [mounted, setMounted] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [stealthMode, setStealthMode] = useState(false);

  // 🔥 STATES
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [voiceText, setVoiceText] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [danger, setDanger] = useState(false);

  // 🔥 REF (IMPORTANT FIX)
  const recognitionRef = useRef<any>(null);
  const isListeningRef = useRef(false);

  // ✅ AUTH
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

  // 📍 GPS TRACKING
  useEffect(() => {
    const watch = navigator.geolocation.watchPosition(
      (pos) => {
        setLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
      },
      (err) => console.error("GPS Error:", err),
      { enableHighAccuracy: true }
    );

    return () => navigator.geolocation.clearWatch(watch);
  }, []);

  // 🎤 VOICE DETECTION (FULL FIXED)
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("❌ Use Google Chrome for voice detection");
      return;
    }

    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;

    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-IN";

    recognition.onstart = () => {
      console.log("🎤 Mic started");
      setIsListening(true);
      isListeningRef.current = true;
    };

    recognition.onresult = (event: any) => {
      let finalText = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        finalText += event.results[i][0].transcript;
      }

      console.log("🎤 Heard:", finalText);
      setVoiceText(finalText);

      // 🚨 KEYWORD DETECTION
      if (
        finalText.toLowerCase().includes("help") ||
        finalText.toLowerCase().includes("danger") ||
        finalText.toLowerCase().includes("save me")
      ) {
        console.log("🚨 SOS TRIGGERED");
        triggerSOS(finalText);
      }
    };

    recognition.onerror = (event: any) => {
      if (event.error === "aborted") {
        console.log("⚠️ Mic restart (normal)");
        return;
      }

      if (event.error === "not-allowed") {
        alert("❌ Microphone permission denied");
        return;
      }

      console.error("Speech error:", event.error);
    };

    recognition.onend = () => {
      console.log("🔁 Mic ended");

      // restart only if not already running
      if (isListeningRef.current) {
        try {
          recognition.start();
        } catch {
          console.log("⚠️ Restart skipped");
        }
      }
    };

    recognition.start();

    return () => {
      isListeningRef.current = false;
      recognition.stop();
    };
  }, []);

  // 🚨 SOS FUNCTION
  const triggerSOS = (voice?: string) => {
    setDanger(true);

    const message = `
🚨 EMERGENCY ALERT
User: ${user?.name}
Location: ${location?.lat}, ${location?.lng}
Voice: ${voice || voiceText}
`;

    console.log(message);

    alert("🚨 SOS Triggered! Help is on the way.");
  };

  const handleLogout = () => {
    setCurrentUser(null);
    router.push("/login");
  };

  if (!mounted || !user) return null;

  return (
    <SafetyProvider>
      <div className="min-h-screen bg-white flex flex-col">

        {/* HEADER */}
        <header className="sticky top-0 z-50 bg-white border-b border-gray-100 w-full">
          <div className="w-full px-6 py-3 flex items-center justify-between">

            {/* LEFT */}
            <div className="flex items-center gap-3">
              <img
                src="/logo.png"
                alt="SafeGuard Logo"
                className="h-20 w-20 object-contain"
              />
              <div>
                <h1 className="font-bold text-lg text-gray-900">SafeGuard</h1>
                <p className="text-[10px] text-gray-400">
                  Welcome, {user.name.split(" ")[0]}
                </p>

                {/* STATUS */}
                <div className="text-[10px] text-gray-500 mt-1 flex gap-3">
                  <span className="flex items-center gap-1">
                    <MapPin size={12} />
                    {location ? "Tracking" : "No GPS"}
                  </span>

                  <span className="flex items-center gap-1">
                    <Mic size={12} />
                    {isListening ? "Listening" : "Mic Off"}
                  </span>

                  <span className={danger ? "text-red-500" : "text-green-500"}>
                    {danger ? "Danger 🚨" : "Safe ✅"}
                  </span>
                </div>

                {/* VOICE TEXT */}
                <p className="text-[10px] text-gray-400 mt-1">
                  Voice: {voiceText || "Say something..."}
                </p>
              </div>
            </div>

            {/* RIGHT */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => setShowStats(!showStats)}
                className="p-2 hover:bg-gray-50 rounded-full"
              >
                <Activity size={20} className="text-gray-500" />
              </button>

              <button
                onClick={() => setStealthMode(!stealthMode)}
                className={`px-4 py-1.5 rounded-md text-sm font-semibold ${
                  stealthMode
                    ? "bg-green-600 text-white"
                    : "bg-gray-200 text-gray-700"
                }`}
              >
                Stealth {stealthMode ? "ON" : "OFF"}
              </button>

              <button
                onClick={handleLogout}
                className="p-2 hover:bg-red-50 rounded-full text-gray-400 hover:text-red-500"
              >
                <LogOut size={20} />
              </button>
            </div>
          </div>
        </header>

        {/* MAIN */}
        <main className="flex-1 w-full">
          <SafetyDashboard />
        </main>
      </div>
    </SafetyProvider>
  );
}