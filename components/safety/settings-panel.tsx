"use client";

import { useState, useCallback } from "react";
import { useSafety } from "@/lib/safety-context";
import {
  Settings,
  X,
  User,
  Plus,
  Trash2,
  Lock,
  Bell,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { EmergencyContact } from "@/lib/safety-store";

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsPanel({ isOpen, onClose }: SettingsPanelProps) {
  const { settings, updateSettings, logActivity } = useSafety();
  const [activeTab, setActiveTab] = useState<"contacts" | "security" | "alerts">("contacts");
  const [saved, setSaved] = useState(false);

  // Keep name and relationship in newContact, but handle phone parts separately
  const [newContact, setNewContact] = useState<Omit<EmergencyContact, "id" | "phone">>({
    name: "",
    relationship: "",
  });

  // Separate phone state parts
  const [countryCode, setCountryCode] = useState("+91");
  const [phoneNumber, setPhoneNumber] = useState("");

  const addContact = useCallback(() => {
    const fullPhone = countryCode + phoneNumber;

    if (newContact.name && phoneNumber.length > 5) {
      const contact: EmergencyContact = {
        id: crypto.randomUUID(),
        name: newContact.name,
        relationship: newContact.relationship,
        phone: fullPhone,
      };
      updateSettings({
        emergencyContacts: [...settings.emergencyContacts, contact],
      });
      setNewContact({ name: "", relationship: "" });
      setCountryCode("+91");
      setPhoneNumber("");
      logActivity("sos", `Added emergency contact: ${contact.name}`);
    }
  }, [newContact, phoneNumber, countryCode, settings.emergencyContacts, updateSettings, logActivity]);

  const removeContact = useCallback((id: string) => {
    updateSettings({
      emergencyContacts: settings.emergencyContacts.filter((c) => c.id !== id),
    });
    logActivity("sos", "Removed emergency contact");
  }, [settings.emergencyContacts, updateSettings, logActivity]);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    logActivity("sos", "Settings saved");
  };

  const tabs = [
    { id: "contacts", label: "Contacts", icon: User },
    { id: "security", label: "Security", icon: Lock },
    { id: "alerts", label: "Alerts", icon: Bell },
  ] as const;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-background/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg bg-card rounded-xl border shadow-xl overflow-hidden max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b shrink-0">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-muted-foreground" />
            <h2 className="text-lg font-semibold">Settings</h2>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-muted rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b shrink-0">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium",
                activeTab === tab.id
                  ? "text-primary border-b-2 border-primary"
                  : "text-muted-foreground"
              )}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">

          {activeTab === "contacts" && (
            <div className="space-y-4">

              {/* Add Contact */}
              <div className="p-4 rounded-xl border bg-muted/30">
                <h3 className="font-medium mb-3">Add Emergency Contact</h3>

                <div className="space-y-3">

                  <Input
                    value={newContact.name}
                    onChange={(e) =>
                      setNewContact({ ...newContact, name: e.target.value })
                    }
                    placeholder="Contact Name"
                  />

                  <Input
                    value={newContact.relationship}
                    onChange={(e) =>
                      setNewContact({
                        ...newContact,
                        relationship: e.target.value,
                      })
                    }
                    placeholder="Relationship"
                  />

                  {/* Phone Section */}
                  <div className="flex gap-2">

                    <select
                      className="px-3 py-2 rounded-md border bg-background text-sm min-w-[90px]"
                      value={countryCode}
                      onChange={(e) => setCountryCode(e.target.value)}
                    >
                      <option value="+91">+91</option>
                      <option value="+1">+1</option>
                      <option value="+44">+44</option>
                      <option value="+61">+61</option>
                      <option value="+49">+49</option>
                    </select>

                    <Input
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="Phone Number"
                      className="flex-1"
                      type="tel"
                    />
                  </div>

                  <Button
                    onClick={addContact}
                    className="w-full"
                    disabled={!newContact.name || phoneNumber.length < 6}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Contact
                  </Button>

                </div>
              </div>

              {/* Contacts List */}
              <div className="space-y-2">
                <h3 className="font-medium">
                  Emergency Contacts ({settings.emergencyContacts.length})
                </h3>

                {settings.emergencyContacts.map((contact) => (
                  <div
                    key={contact.id}
                    className="flex items-center gap-3 p-3 border rounded-lg"
                  >
                    <User className="w-5 h-5" />
                    <div className="flex-1">
                      <p>{contact.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {contact.phone}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removeContact(contact.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}

              </div>
            </div>
          )}
        </div>

        {/* Save */}
        <div className="p-4 border-t">
          <Button onClick={handleSave} className="w-full">
            {saved ? "Saved!" : "Save Settings"}
          </Button>
        </div>

      </div>
    </div>
  );
}