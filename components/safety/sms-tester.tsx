"use client";

import { useState } from "react";
import { useSafety } from "@/lib/safety-context";
import { incrementStat } from "@/lib/auth-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { X, MessageSquare, Send, CheckCircle, AlertCircle, Loader2, Phone, PhoneCall } from "lucide-react";
import { cn } from "@/lib/utils";

interface SMSTesterProps {
  isOpen: boolean;
  onClose: () => void;
}

const COUNTRY_CODES = [
  { code: "+91", country: "India", flag: "IN" },
  { code: "+1", country: "USA/Canada", flag: "US" },
  { code: "+44", country: "UK", flag: "GB" },
  { code: "+61", country: "Australia", flag: "AU" },
  { code: "+49", country: "Germany", flag: "DE" },
  { code: "+33", country: "France", flag: "FR" },
  { code: "+81", country: "Japan", flag: "JP" },
  { code: "+86", country: "China", flag: "CN" },
  { code: "+971", country: "UAE", flag: "AE" },
  { code: "+65", country: "Singapore", flag: "SG" },
];

export function SMSTester({ isOpen, onClose }: SMSTesterProps) {
  const safetyContext = useSafety();
  const { state, logActivity } = safetyContext;
  const [countryCode, setCountryCode] = useState("+91");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [customMessage, setCustomMessage] = useState("");
  const [useCustomMessage, setUseCustomMessage] = useState(false);
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [resultMessage, setResultMessage] = useState("");
  const [errorHint, setErrorHint] = useState("");
  const [demoMode, setDemoMode] = useState(true); // Demo mode ON by default
  const [sendType, setSendType] = useState<"sms" | "call">("sms");

  const location = state?.currentLocation;
  const defaultMessage = `EMERGENCY ALERT! I need help immediately!\n\n${
    location 
      ? `Location: https://www.google.com/maps?q=${location.lat},${location.lng}` 
      : "Location: Unable to determine"
  }\n\nSent via SafeGuard App`;

  const handleSend = async () => {
    if (!phoneNumber.trim()) {
      setStatus("error");
      setResultMessage("Please enter a phone number");
      setErrorHint("");
      return;
    }

    // Clean phone number - remove spaces, dashes
    const cleanNumber = phoneNumber.replace(/[\s\-\(\)]/g, "");
    
    // Build full number with country code
    let fullNumber = cleanNumber;
    if (!cleanNumber.startsWith("+")) {
      fullNumber = countryCode + cleanNumber;
    }

    setStatus("sending");
    setResultMessage("");
    setErrorHint("");

    const message = useCustomMessage && customMessage.trim() 
      ? customMessage 
      : `EMERGENCY ALERT! I need help immediately!\n\n${
          location 
            ? `Location: https://www.google.com/maps?q=${location.lat},${location.lng}` 
            : "Location: Unable to determine"
        }\n\nSent via SafeGuard App`;

    try {
      const endpoint = sendType === "sms" ? "/api/send-sms" : "/api/make-call";
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          to: fullNumber, 
          message,
          demoMode 
        }),
      });

      const result = await response.json();

      if (result.success) {
        setStatus("success");
        const typeLabel = sendType === "sms" ? "SMS" : "Call";
        setResultMessage(
          result.demoMode 
            ? `${typeLabel} sent successfully! (Demo Mode)` 
            : `${typeLabel} sent successfully! Check your phone.`
        );
        // Update usage stats
        if (sendType === "sms") {
          incrementStat("smsSent");
        } else {
          incrementStat("callsMade");
        }
        logActivity("sos", `Test ${typeLabel} sent to ${fullNumber}${result.demoMode ? " (Demo)" : ""}`);
      } else {
        setStatus("error");
        setResultMessage(result.error || `Failed to send ${sendType === "sms" ? "SMS" : "call"}`);
        setErrorHint(result.hint || "");
      }
    } catch (error) {
      setStatus("error");
      setResultMessage("Network error. Please try again.");
      setErrorHint("");
    }
  };

  const handleReset = () => {
    setStatus("idle");
    setResultMessage("");
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-background/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-card rounded-xl border shadow-xl overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold">Test SMS Alert</h2>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-muted rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {status === "success" ? (
            <div className="text-center py-8">
              <CheckCircle className="w-16 h-16 mx-auto text-safe mb-4" />
              <h3 className="text-xl font-semibold text-safe mb-2">
                {sendType === "sms" ? "SMS" : "Call"} Sent!
              </h3>
              <p className="text-muted-foreground mb-6">{resultMessage}</p>
              <Button onClick={handleReset} variant="outline">
                Send Another Test
              </Button>
            </div>
          ) : (
            <>
              {/* Demo Mode Toggle */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-safe/10 border border-safe/20">
                <div>
                  <p className="font-medium text-safe text-sm">Demo Mode</p>
                  <p className="text-xs text-muted-foreground">Always succeeds for showcase</p>
                </div>
                <Switch 
                  checked={demoMode} 
                  onCheckedChange={setDemoMode}
                />
              </div>

              {/* SMS or Call Toggle */}
              <div className="flex gap-2">
                <Button
                  variant={sendType === "sms" ? "default" : "outline"}
                  onClick={() => setSendType("sms")}
                  className="flex-1 gap-2"
                >
                  <MessageSquare className="w-4 h-4" />
                  SMS
                </Button>
                <Button
                  variant={sendType === "call" ? "default" : "outline"}
                  onClick={() => setSendType("call")}
                  className="flex-1 gap-2"
                >
                  <PhoneCall className="w-4 h-4" />
                  Call
                </Button>
              </div>

              {/* Phone Number Input */}
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  Phone Number
                </label>
                <div className="flex gap-2">
                  <select
                    value={countryCode}
                    onChange={(e) => setCountryCode(e.target.value)}
                    className="px-3 py-2 rounded-lg border bg-background text-sm font-mono min-w-[100px]"
                  >
                    {COUNTRY_CODES.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.code} {c.country}
                      </option>
                    ))}
                  </select>
                  <Input
                    type="tel"
                    placeholder="8105761234"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value.replace(/[^\d]/g, ""))}
                    className="font-mono flex-1"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Select country code and enter number without leading zero
                </p>
                <div className="p-2 rounded bg-muted/50 text-xs font-mono">
                  Full number: <span className="text-primary font-semibold">{countryCode}{phoneNumber || "XXXXXXXXXX"}</span>
                </div>
              </div>

              {/* Message Preview */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Message</label>
                  <button
                    onClick={() => setUseCustomMessage(!useCustomMessage)}
                    className="text-xs text-primary hover:underline"
                  >
                    {useCustomMessage ? "Use default message" : "Customize message"}
                  </button>
                </div>
                
                {useCustomMessage ? (
                  <Textarea
                    placeholder="Enter your custom emergency message..."
                    value={customMessage}
                    onChange={(e) => setCustomMessage(e.target.value)}
                    rows={4}
                  />
                ) : (
                  <div className="p-3 rounded-lg bg-muted/50 text-sm whitespace-pre-wrap">
                    {defaultMessage}
                  </div>
                )}
              </div>

              {/* Error Message */}
              {status === "error" && (
                <div className="p-3 rounded-lg bg-destructive/10 text-sm space-y-2">
                  <div className="flex items-start gap-2 text-destructive">
                    <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                    <span>{resultMessage}</span>
                  </div>
                  {errorHint && (
                    <p className="text-xs text-muted-foreground pl-6">{errorHint}</p>
                  )}
                </div>
              )}

              {/* Location Status */}
              <div className="p-3 rounded-lg bg-muted/50">
                <p className="text-xs text-muted-foreground mb-1">Current Location</p>
                {location ? (
                  <p className="text-sm font-mono">
                    {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
                  </p>
                ) : (
                  <p className="text-sm text-warning">Location not available</p>
                )}
              </div>

              {/* Send Button */}
              <Button
                onClick={handleSend}
                disabled={status === "sending" || !phoneNumber.trim()}
                size="lg"
                className={cn(
                  "w-full",
                  sendType === "call" ? "bg-primary" : "bg-safe hover:bg-safe/90",
                  status === "sending" && "opacity-70"
                )}
              >
                {status === "sending" ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {sendType === "sms" ? "Sending SMS..." : "Initiating Call..."}
                  </>
                ) : (
                  <>
                    {sendType === "sms" ? (
                      <Send className="w-4 h-4 mr-2" />
                    ) : (
                      <PhoneCall className="w-4 h-4 mr-2" />
                    )}
                    {sendType === "sms" ? "Send Test SMS" : "Make Test Call"}
                  </>
                )}
              </Button>

              <p className="text-xs text-center text-muted-foreground">
                {demoMode 
                  ? "Demo mode is ON - this will simulate sending without using real services."
                  : "This will use Twilio to send real messages. Standard rates may apply."
                }
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
