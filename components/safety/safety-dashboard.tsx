"use client";

import { useState, useEffect } from "react";
import { useSafety } from "@/lib/safety-context";
import SOSButton from "./sos-button";
import { RiskIndicator } from "./risk-indicator";
import { SafetyScore } from "./safety-score";
import { QuickActions } from "./quick-actions";
import { LocationTracker } from "./location-tracker";
import { BatteryMonitor } from "./battery-monitor";
import { FakeCall } from "./fake-call";
import { SafetyTimer } from "./safety-timer";
import { AlarmSystem } from "./alarm-system";
import { PinTrigger } from "./pin-trigger";
import { VoiceDetection } from "./voice-detection";
import { FollowDetection } from "./follow-detection";
import { FlashlightMode } from "./flashlight-mode";
import { SafePlaces } from "./safe-places";
import { LegalAssistant } from "./legal-assistant";
import { ComplaintGenerator } from "./complaint-generator";
import { EvidenceCapture } from "./evidence-capture";
import { ActivityLog } from "./activity-log";
import { DemoControls } from "./demo-controls";
import { SettingsPanel } from "./settings-panel";
import { SMSTester } from "./sms-tester";
import { LiveMap } from "./live-map";
import { CrimeHeatmap } from "./crime-heatmap";
import { EmergencySetup } from "./emergency-setup";
import {
  Shield,
  Settings,
  Scale,
  Clock,
  Sliders,
  Mic,
  Users,
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";

export function SafetyDashboard() {
  const { state, settings } = useSafety();

  // Modal states
  const [showFakeCall, setShowFakeCall] = useState(false);
  const [showTimer, setShowTimer] = useState(false);
  const [showAlarm, setShowAlarm] = useState(false);
  const [showPinTrigger, setShowPinTrigger] = useState(false);
  const [showVoiceDetection, setShowVoiceDetection] = useState(false);
  const [showFollowDetection, setShowFollowDetection] = useState(false);
  const [showFlashlight, setShowFlashlight] = useState(false);
  const [showSafePlaces, setShowSafePlaces] = useState(false);
  const [showLegalAssistant, setShowLegalAssistant] = useState(false);
  const [showComplaint, setShowComplaint] = useState(false);
  const [showEvidence, setShowEvidence] = useState(false);
  const [showActivityLog, setShowActivityLog] = useState(false);
  const [showDemoControls, setShowDemoControls] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showSMSTester, setShowSMSTester] = useState(false);
  const [showLiveMap, setShowLiveMap] = useState(false);
  const [showCrimeHeatmap, setShowCrimeHeatmap] = useState(false);
  const [showSetup, setShowSetup] = useState(false);
  const [hasCompletedSetup, setHasCompletedSetup] = useState(true);
  
  // State for inline map view toggle (separate from modals)
  const [activeMapView, setActiveMapView] = useState<"live" | "heatmap">("live");

  // Check if setup is needed
  useEffect(() => {
    const setupDone = localStorage.getItem("safeguard_setup_complete");
    if (!setupDone && settings.emergencyContacts.length === 0) {
      setShowSetup(true);
      setHasCompletedSetup(false);
    }
  }, [settings.emergencyContacts.length]);

  const handleSetupComplete = () => {
    localStorage.setItem("safeguard_setup_complete", "true");
    setShowSetup(false);
    setHasCompletedSetup(true);
  };

  // Show setup wizard for new users
  if (showSetup) {
    return <EmergencySetup onComplete={handleSetupComplete} />;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Background image - Women Safety App Logo */}
      <div 
        className="fixed inset-0 opacity-[0.04] pointer-events-none bg-center bg-no-repeat z-0"
        style={{ 
          backgroundImage: "url('https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-vP76vXsAPqObxnESlFV4UTfxsJIMPE.png')", 
          backgroundSize: "40%" 
        }}
      />

      {/* Header */}
      <header className="sticky top-0 z-30 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white shadow-md overflow-hidden p-1">
                <img 
                  src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-vP76vXsAPqObxnESlFV4UTfxsJIMPE.png" 
                  alt="Women Safety App" 
                  className="w-full h-full object-contain"
                />
              </div>
              <div>
                <h1 className="font-bold text-lg">Women Safety</h1>
                <p className="text-xs text-muted-foreground">
                  Violence Against Women - Never Again
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {/* Status indicators */}
              {state.isVoiceDetectionActive && (
                <div className="p-1.5 rounded-lg bg-primary/10" title="Voice detection active">
                  <Mic className="w-4 h-4 text-primary animate-pulse" />
                </div>
              )}
              {state.isFollowDetection && (
                <div className="p-1.5 rounded-lg bg-chart-4/10" title="Follow detection active">
                  <Users className="w-4 h-4 text-chart-4 animate-pulse" />
                </div>
              )}
              <RiskIndicator compact />
              <button
                onClick={() => setShowLegalAssistant(true)}
                className="p-2 hover:bg-muted rounded-lg transition-colors"
                title="Legal Assistant"
              >
                <Scale className="w-5 h-5" />
              </button>
              <button
                onClick={() => setShowActivityLog(true)}
                className="p-2 hover:bg-muted rounded-lg transition-colors"
                title="Activity Log"
              >
                <Clock className="w-5 h-5" />
              </button>
              <button
                onClick={() => setShowSettings(true)}
                className="p-2 hover:bg-muted rounded-lg transition-colors"
                title="Settings"
              >
                <Settings className="w-5 h-5" />
              </button>
              <button
                onClick={() => setShowDemoControls(true)}
                className="p-2 hover:bg-muted rounded-lg transition-colors"
                title="Demo Controls"
              >
                <Sliders className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6 pb-24 relative z-10">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Emergency Contacts Warning */}
          {settings.emergencyContacts.length === 0 && (
            <section className="animate-fade-in">
              <button 
                onClick={() => setShowSettings(true)}
                className="w-full p-4 rounded-xl bg-warning/10 border border-warning/30 hover:bg-warning/20 transition-colors text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-warning/20">
                    <AlertTriangle className="w-5 h-5 text-warning" />
                  </div>
                  <div>
                    <p className="font-medium text-warning">No Emergency Contacts</p>
                    <p className="text-sm text-muted-foreground">
                      Tap here to add contacts for SOS alerts
                    </p>
                  </div>
                </div>
              </button>
            </section>
          )}

          {/* SOS Button Section */}
          <section className="flex flex-col items-center py-8">
            <SOSButton />
          </section>

          {/* Risk Indicator (detailed) */}
          <section>
            <RiskIndicator />
          </section>

          {/* Quick Actions */}
          <section>
            <h2 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">
              Quick Actions
            </h2>
            <QuickActions
              onOpenFakeCall={() => setShowFakeCall(true)}
              onOpenTimer={() => setShowTimer(true)}
              onOpenAlarm={() => setShowAlarm(true)}
              onOpenPinTrigger={() => setShowPinTrigger(true)}
              onOpenEvidence={() => setShowEvidence(true)}
              onOpenComplaint={() => setShowComplaint(true)}
              onOpenSafePlaces={() => setShowSafePlaces(true)}
              onOpenFlashlight={() => setShowFlashlight(true)}
              onOpenSMSTester={() => setShowSMSTester(true)}
              onOpenLiveMap={() => setShowLiveMap(true)}
            />
          </section>

          {/* Maps Section - Toggle between Live Map and Crime Heatmap */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveMapView("live")}
                  className={cn(
                    "text-sm font-semibold uppercase tracking-wide px-3 py-1 rounded-lg transition-colors",
                    activeMapView === "live" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  Live Location
                </button>
                <button
                  onClick={() => setActiveMapView("heatmap")}
                  className={cn(
                    "text-sm font-semibold uppercase tracking-wide px-3 py-1 rounded-lg transition-colors",
                    activeMapView === "heatmap" ? "bg-warning/10 text-warning" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  Crime Heatmap
                </button>
              </div>
              <button
                onClick={() => activeMapView === "heatmap" ? setShowCrimeHeatmap(true) : setShowLiveMap(true)}
                className="text-xs text-primary hover:underline"
              >
                Full Screen
              </button>
            </div>
            {/* Only render one map at a time to prevent overlap */}
            <div className="relative">
              {activeMapView === "live" && <LiveMap compact />}
              {activeMapView === "heatmap" && <CrimeHeatmap compact />}
            </div>
            {/* Map toggle hint */}
            <p className="text-xs text-muted-foreground mt-2 text-center">
              {activeMapView === "heatmap" 
                ? "Viewing crime hotspots - useful when traveling by cab/bus"
                : "Viewing your live location"
              }
            </p>
          </section>

          {/* Stats Row */}
          <section className="grid gap-4 sm:grid-cols-2">
            <SafetyScore />
            <BatteryMonitor />
          </section>

          {/* Location Tracker */}
          <section>
            <LocationTracker />
          </section>

          {/* Voice & Follow Detection Cards */}
          <section>
            <h2 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">
              Active Monitoring
            </h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <button
                onClick={() => setShowVoiceDetection(true)}
                className={cn(
                  "p-4 rounded-xl border text-left transition-all hover:border-primary/50",
                  state.isVoiceDetectionActive && "border-primary bg-primary/5"
                )}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      "p-2 rounded-lg",
                      state.isVoiceDetectionActive
                        ? "bg-primary/20"
                        : "bg-muted"
                    )}
                  >
                    <Mic
                      className={cn(
                        "w-5 h-5",
                        state.isVoiceDetectionActive
                          ? "text-primary animate-pulse"
                          : "text-muted-foreground"
                      )}
                    />
                  </div>
                  <div>
                    <p className="font-medium">Voice Detection</p>
                    <p className="text-sm text-muted-foreground">
                      {state.isVoiceDetectionActive
                        ? "Listening for trigger words"
                        : "Tap to enable"}
                    </p>
                  </div>
                </div>
              </button>

              <button
                onClick={() => setShowFollowDetection(true)}
                className={cn(
                  "p-4 rounded-xl border text-left transition-all hover:border-chart-4/50",
                  state.isFollowDetection && "border-chart-4 bg-chart-4/5"
                )}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      "p-2 rounded-lg",
                      state.isFollowDetection ? "bg-chart-4/20" : "bg-muted"
                    )}
                  >
                    <Users
                      className={cn(
                        "w-5 h-5",
                        state.isFollowDetection
                          ? "text-chart-4 animate-pulse"
                          : "text-muted-foreground"
                      )}
                    />
                  </div>
                  <div>
                    <p className="font-medium">Follow Detection</p>
                    <p className="text-sm text-muted-foreground">
                      {state.isFollowDetection
                        ? "Monitoring movement patterns"
                        : "Tap to enable"}
                    </p>
                  </div>
                </div>
              </button>
            </div>
          </section>
        </div>
      </main>

      {/* Modals */}
      <FakeCall isOpen={showFakeCall} onClose={() => setShowFakeCall(false)} />
      <SafetyTimer isOpen={showTimer} onClose={() => setShowTimer(false)} />
      <AlarmSystem isOpen={showAlarm} onClose={() => setShowAlarm(false)} />
      <PinTrigger isOpen={showPinTrigger} onClose={() => setShowPinTrigger(false)} />
      <VoiceDetection isOpen={showVoiceDetection} onClose={() => setShowVoiceDetection(false)} />
      <FollowDetection isOpen={showFollowDetection} onClose={() => setShowFollowDetection(false)} />
      <FlashlightMode isOpen={showFlashlight} onClose={() => setShowFlashlight(false)} />
      <SafePlaces isOpen={showSafePlaces} onClose={() => setShowSafePlaces(false)} />
      <LegalAssistant isOpen={showLegalAssistant} onClose={() => setShowLegalAssistant(false)} />
      <ComplaintGenerator isOpen={showComplaint} onClose={() => setShowComplaint(false)} />
      <EvidenceCapture isOpen={showEvidence} onClose={() => setShowEvidence(false)} />
      <ActivityLog isOpen={showActivityLog} onClose={() => setShowActivityLog(false)} />
      <DemoControls isOpen={showDemoControls} onClose={() => setShowDemoControls(false)} />
      <SettingsPanel isOpen={showSettings} onClose={() => setShowSettings(false)} />
      <SMSTester isOpen={showSMSTester} onClose={() => setShowSMSTester(false)} />
      <LiveMap isOpen={showLiveMap} onClose={() => setShowLiveMap(false)} />
      <CrimeHeatmap isOpen={showCrimeHeatmap} onClose={() => setShowCrimeHeatmap(false)} />
    </div>
  );
}
