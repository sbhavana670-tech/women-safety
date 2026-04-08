"use client";

import { useState, useCallback } from "react";
import { useSafety } from "@/lib/safety-context";
import { Lock, Delete, X, Check, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface PinTriggerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PinTrigger({ isOpen, onClose }: PinTriggerProps) {
  const { settings, updateSettings, triggerSOS, logActivity } = useSafety();
  const [pin, setPin] = useState("");
  const [mode, setMode] = useState<"verify" | "setup" | "change">("verify");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleNumberPress = useCallback((num: string) => {
    setError("");
    setSuccess("");
    
    if (mode === "verify") {
      if (pin.length < 4) {
        const newPinValue = pin + num;
        setPin(newPinValue);
        
        if (newPinValue.length === 4) {
          if (newPinValue === settings.emergencyPin) {
            triggerSOS();
            logActivity("pin", "SOS triggered via PIN");
            onClose();
          } else {
            setError("Invalid PIN");
            setTimeout(() => setPin(""), 500);
          }
        }
      }
    } else if (mode === "setup" || mode === "change") {
      if (newPin.length < 4) {
        setNewPin(newPin + num);
      } else if (confirmPin.length < 4) {
        setConfirmPin(confirmPin + num);
      }
    }
  }, [pin, mode, newPin, confirmPin, settings.emergencyPin, triggerSOS, logActivity, onClose]);

  const handleDelete = useCallback(() => {
    setError("");
    if (mode === "verify") {
      setPin(pin.slice(0, -1));
    } else if (mode === "setup" || mode === "change") {
      if (confirmPin.length > 0) {
        setConfirmPin(confirmPin.slice(0, -1));
      } else if (newPin.length > 0) {
        setNewPin(newPin.slice(0, -1));
      }
    }
  }, [mode, pin, newPin, confirmPin]);

  const handleSavePin = useCallback(() => {
    if (newPin.length !== 4) {
      setError("PIN must be 4 digits");
      return;
    }
    if (newPin !== confirmPin) {
      setError("PINs do not match");
      setConfirmPin("");
      return;
    }
    
    updateSettings({ emergencyPin: newPin });
    logActivity("pin", "Emergency PIN updated");
    setSuccess("PIN updated successfully");
    setNewPin("");
    setConfirmPin("");
    setTimeout(() => {
      setMode("verify");
      setSuccess("");
    }, 1500);
  }, [newPin, confirmPin, updateSettings, logActivity]);

  const resetState = useCallback(() => {
    setPin("");
    setNewPin("");
    setConfirmPin("");
    setError("");
    setSuccess("");
  }, []);

  if (!isOpen) return null;

  const renderDots = (value: string, max: number = 4) => (
    <div className="flex gap-3 justify-center my-6">
      {Array.from({ length: max }).map((_, i) => (
        <div
          key={i}
          className={cn(
            "w-4 h-4 rounded-full transition-all",
            i < value.length
              ? error
                ? "bg-destructive animate-shake"
                : "bg-primary scale-110"
              : "bg-muted"
          )}
        />
      ))}
    </div>
  );

  const renderKeypad = () => (
    <div className="grid grid-cols-3 gap-3">
      {[1, 2, 3, 4, 5, 6, 7, 8, 9, "", 0, "delete"].map((key, index) => {
        if (key === "") {
          return <div key={index} />;
        }
        if (key === "delete") {
          return (
            <button
              key={index}
              onClick={handleDelete}
              className="aspect-square flex items-center justify-center rounded-xl bg-muted hover:bg-muted/80 active:scale-95 transition-all"
            >
              <Delete className="w-6 h-6" />
            </button>
          );
        }
        return (
          <button
            key={index}
            onClick={() => handleNumberPress(String(key))}
            className="aspect-square flex items-center justify-center rounded-xl bg-card border hover:bg-muted active:scale-95 transition-all text-2xl font-semibold"
          >
            {key}
          </button>
        );
      })}
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-background/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm bg-card rounded-xl border shadow-xl overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <Lock className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold">
              {mode === "verify" ? "Emergency PIN" : mode === "setup" ? "Set PIN" : "Change PIN"}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            {mode === "verify" && (
              <button
                onClick={() => {
                  resetState();
                  setMode("change");
                }}
                className="p-1 hover:bg-muted rounded-lg"
              >
                <Settings className="w-5 h-5" />
              </button>
            )}
            <button
              onClick={() => {
                resetState();
                setMode("verify");
                onClose();
              }}
              className="p-1 hover:bg-muted rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6">
          {mode === "verify" ? (
            <>
              <p className="text-center text-muted-foreground mb-2">
                Enter your 4-digit emergency PIN
              </p>
              {renderDots(pin)}
              {error && (
                <p className="text-center text-sm text-destructive mb-4">{error}</p>
              )}
              {renderKeypad()}
              <p className="text-xs text-muted-foreground text-center mt-4">
                Enter your PIN to trigger emergency SOS
              </p>
            </>
          ) : (
            <>
              <div className="text-center mb-4">
                <p className="text-muted-foreground">
                  {newPin.length < 4
                    ? "Enter new 4-digit PIN"
                    : "Confirm your PIN"}
                </p>
              </div>
              
              <div className="flex justify-center gap-8 mb-4">
                <div className="text-center">
                  <p className="text-xs text-muted-foreground mb-1">New PIN</p>
                  <div className="flex gap-2">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <div
                        key={i}
                        className={cn(
                          "w-3 h-3 rounded-full",
                          i < newPin.length ? "bg-primary" : "bg-muted"
                        )}
                      />
                    ))}
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground mb-1">Confirm</p>
                  <div className="flex gap-2">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <div
                        key={i}
                        className={cn(
                          "w-3 h-3 rounded-full",
                          i < confirmPin.length ? "bg-primary" : "bg-muted"
                        )}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {error && (
                <p className="text-center text-sm text-destructive mb-4">{error}</p>
              )}
              {success && (
                <p className="text-center text-sm text-safe mb-4 flex items-center justify-center gap-1">
                  <Check className="w-4 h-4" />
                  {success}
                </p>
              )}

              {renderKeypad()}

              <div className="flex gap-3 mt-4">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    resetState();
                    setMode("verify");
                  }}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1"
                  onClick={handleSavePin}
                  disabled={newPin.length < 4 || confirmPin.length < 4}
                >
                  Save PIN
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
