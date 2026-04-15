"use client";

import { useState } from "react";
import { useSafety } from "@/lib/safety-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Shield, Phone, Plus, X, Check, ChevronRight, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface EmergencySetupProps {
  onComplete: () => void;
}

const COUNTRY_CODES = [
  { code: "+91", country: "India" },
  { code: "+1", country: "USA/Canada" },
  { code: "+44", country: "UK" },
  { code: "+61", country: "Australia" },
  { code: "+49", country: "Germany" },
];

export function EmergencySetup({ onComplete }: EmergencySetupProps) {
  const { updateSettings, settings } = useSafety();
  const [step, setStep] = useState(1);
  const [contacts, setContacts] = useState<Array<{ name: string; phone: string; relationship: string }>>([]);
  const [currentContact, setCurrentContact] = useState({ name: "", phone: "", relationship: "", countryCode: "+91" });
  const [emergencyPin, setEmergencyPin] = useState("1234");

  const addContact = () => {
    if (currentContact.name && currentContact.phone) {
      const fullPhone = currentContact.phone.startsWith("+") 
        ? currentContact.phone 
        : currentContact.countryCode + currentContact.phone;
      
      setContacts([...contacts, { 
        name: currentContact.name, 
        phone: fullPhone, 
        relationship: currentContact.relationship || "Emergency Contact" 
      }]);
      setCurrentContact({ name: "", phone: "", relationship: "", countryCode: "+91" });
    }
  };

  const removeContact = (index: number) => {
    setContacts(contacts.filter((_, i) => i !== index));
  };

  const handleComplete = () => {
    updateSettings({
      emergencyContacts: contacts,
      emergencyPin,
    });
    onComplete();
  };

  return (
    <div className="fixed inset-0 z-50 bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-card rounded-3xl shadow-2xl overflow-hidden">
        {/* Header with logo */}
        <div className="bg-gradient-to-br from-pink-500 to-pink-600 p-6 text-white text-center">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-white/20 flex items-center justify-center">
            <Shield className="w-10 h-10" />
          </div>
          <h1 className="text-2xl font-bold">Welcome to SafeGuard</h1>
          <p className="text-pink-100 text-sm mt-1">Your Safety, Our Priority</p>
        </div>

        {/* Progress indicator */}
        <div className="flex justify-center gap-2 py-4 bg-muted/30">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={cn(
                "w-8 h-2 rounded-full transition-colors",
                s <= step ? "bg-pink-500" : "bg-muted"
              )}
            />
          ))}
        </div>

        {/* Content */}
        <div className="p-6">
          {step === 1 && (
            <div className="space-y-4 animate-fade-in">
              <div className="flex items-center gap-3 text-warning bg-warning/10 p-3 rounded-xl">
                <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                <p className="text-sm">Add at least one emergency contact to enable SOS alerts</p>
              </div>

              <h2 className="text-lg font-semibold">Add Emergency Contacts</h2>
              <p className="text-sm text-muted-foreground">
                These contacts will receive SMS and calls when you activate SOS
              </p>

              {/* Current contacts list */}
              {contacts.length > 0 && (
                <div className="space-y-2">
                  {contacts.map((contact, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-muted/50">
                      <div>
                        <p className="font-medium">{contact.name}</p>
                        <p className="text-sm text-muted-foreground">{contact.phone}</p>
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => removeContact(idx)}>
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {/* Add contact form */}
              <div className="space-y-3 p-4 rounded-xl border border-dashed">
                <Input
                  placeholder="Contact Name"
                  value={currentContact.name}
                  onChange={(e) => setCurrentContact({ ...currentContact, name: e.target.value })}
                />
                <Input
                  placeholder="Relationship (e.g., Mom, Friend)"
                  value={currentContact.relationship}
                  onChange={(e) => setCurrentContact({ ...currentContact, relationship: e.target.value })}
                />
                <div className="flex gap-2">
                  <select
                    value={currentContact.countryCode}
                    onChange={(e) => setCurrentContact({ ...currentContact, countryCode: e.target.value })}
                    className="px-3 py-2 rounded-lg border bg-background text-sm min-w-[90px]"
                  >
                    {COUNTRY_CODES.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.code}
                      </option>
                    ))}
                  </select>
                  <Input
                    type="tel"
                    placeholder="Phone Number"
                    value={currentContact.phone}
                    onChange={(e) => setCurrentContact({ ...currentContact, phone: e.target.value.replace(/[^\d]/g, "") })}
                    className="flex-1"
                  />
                </div>
                <Button onClick={addContact} variant="outline" className="w-full gap-2" disabled={!currentContact.name || !currentContact.phone}>
                  <Plus className="w-4 h-4" />
                  Add Contact
                </Button>
              </div>

              <Button
                onClick={() => setStep(2)}
                className="w-full bg-pink-500 hover:bg-pink-600"
                disabled={contacts.length === 0}
              >
                Continue
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>

              <button onClick={onComplete} className="w-full text-sm text-muted-foreground hover:text-foreground">
                Skip for now
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4 animate-fade-in">
              <h2 className="text-lg font-semibold">Set Emergency PIN</h2>
              <p className="text-sm text-muted-foreground">
                This 4-digit PIN can trigger emergency alerts discreetly
              </p>

              <div className="flex justify-center gap-3 py-6">
                {[0, 1, 2, 3].map((i) => (
                  <Input
                    key={i}
                    type="text"
                    maxLength={1}
                    value={emergencyPin[i] || ""}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^\d]/g, "");
                      const newPin = emergencyPin.split("");
                      newPin[i] = val;
                      setEmergencyPin(newPin.join("").slice(0, 4));
                      // Auto-focus next input
                      if (val && i < 3) {
                        const next = e.target.nextElementSibling as HTMLInputElement;
                        next?.focus();
                      }
                    }}
                    className="w-14 h-14 text-center text-2xl font-bold"
                  />
                ))}
              </div>

              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                  Back
                </Button>
                <Button onClick={() => setStep(3)} className="flex-1 bg-pink-500 hover:bg-pink-600" disabled={emergencyPin.length !== 4}>
                  Continue
                </Button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4 animate-fade-in text-center">
              <div className="w-16 h-16 mx-auto rounded-full bg-safe/10 flex items-center justify-center">
                <Check className="w-8 h-8 text-safe" />
              </div>
              
              <h2 className="text-lg font-semibold">You&apos;re All Set!</h2>
              <p className="text-sm text-muted-foreground">
                Your emergency contacts and PIN have been saved. Stay safe!
              </p>

              <div className="p-4 rounded-xl bg-muted/50 text-left space-y-2">
                <p className="text-sm font-medium">Quick Summary:</p>
                <p className="text-sm text-muted-foreground">
                  {contacts.length} emergency contact{contacts.length !== 1 ? "s" : ""} added
                </p>
                <p className="text-sm text-muted-foreground">
                  Emergency PIN: ****
                </p>
              </div>

              <Button onClick={handleComplete} className="w-full bg-pink-500 hover:bg-pink-600">
                Start Using SafeGuard
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
