"use client";

import { useState, useCallback } from "react";
import { useSafety } from "@/lib/safety-context";
import {
  FileText,
  X,
  Copy,
  Check,
  Download,
  ChevronRight,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface ComplaintGeneratorProps {
  isOpen: boolean;
  onClose: () => void;
}

type ComplaintType = "harassment" | "stalking" | "assault" | "domestic" | "workplace" | "cyber";

const complaintTypes = [
  { id: "harassment", label: "Street Harassment", icon: AlertTriangle },
  { id: "stalking", label: "Stalking", icon: AlertTriangle },
  { id: "assault", label: "Physical Assault", icon: AlertTriangle },
  { id: "domestic", label: "Domestic Violence", icon: AlertTriangle },
  { id: "workplace", label: "Workplace Harassment", icon: AlertTriangle },
  { id: "cyber", label: "Cyber Harassment", icon: AlertTriangle },
] as const;

interface FormData {
  name: string;
  contact: string;
  date: string;
  time: string;
  location: string;
  description: string;
  perpetratorDescription: string;
  witnesses: string;
}

export function ComplaintGenerator({ isOpen, onClose }: ComplaintGeneratorProps) {
  const { state, logActivity } = useSafety();
  const [step, setStep] = useState(1);
  const [complaintType, setComplaintType] = useState<ComplaintType | null>(null);
  const [formData, setFormData] = useState<FormData>({
    name: "",
    contact: "",
    date: new Date().toISOString().split("T")[0],
    time: new Date().toLocaleTimeString("en-US", { hour12: false }).slice(0, 5),
    location: "",
    description: "",
    perpetratorDescription: "",
    witnesses: "",
  });
  const [generatedComplaint, setGeneratedComplaint] = useState<string>("");
  const [copied, setCopied] = useState(false);

  const updateFormData = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const generateComplaint = useCallback(() => {
    const typeLabel = complaintTypes.find((t) => t.id === complaintType)?.label || "Incident";
    
    const complaint = `
COMPLAINT / FIR DRAFT
=====================

TO: The Station House Officer
[Police Station Name]
[Address]

Subject: Complaint regarding ${typeLabel}

Respected Sir/Madam,

I, ${formData.name}, residing at [Your Address], hereby submit this complaint regarding an incident of ${typeLabel.toLowerCase()} that occurred on ${formData.date} at approximately ${formData.time}.

INCIDENT DETAILS:
-----------------
Date of Incident: ${formData.date}
Time of Incident: ${formData.time}
Location: ${formData.location || "[Location to be specified]"}
${state.currentLocation ? `GPS Coordinates: ${state.currentLocation.lat.toFixed(6)}, ${state.currentLocation.lng.toFixed(6)}` : ""}

DESCRIPTION OF INCIDENT:
------------------------
${formData.description || "[Detailed description of what happened]"}

DESCRIPTION OF PERPETRATOR(S):
------------------------------
${formData.perpetratorDescription || "[Physical description, identifying features, vehicle details if any]"}

WITNESSES:
----------
${formData.witnesses || "[Names and contact details of witnesses, if any]"}

REQUEST:
--------
I request you to:
1. Register an FIR under the appropriate sections of IPC
2. Take immediate action against the perpetrator(s)
3. Provide protection if required
4. Investigate the matter thoroughly

I am willing to cooperate fully with the investigation and provide any additional information as required.

Contact Information:
Phone: ${formData.contact || "[Your Phone Number]"}
Email: [Your Email]

Date: ${new Date().toLocaleDateString()}
Place: ${formData.location || "[City]"}

Signature: ________________

${formData.name || "[Your Name]"}

---
Generated using Safety App
Timestamp: ${new Date().toISOString()}
    `.trim();

    setGeneratedComplaint(complaint);
    logActivity("complaint", `Generated ${typeLabel} complaint`);
    setStep(3);
  }, [complaintType, formData, state.currentLocation, logActivity]);

  const copyComplaint = async () => {
    try {
      await navigator.clipboard.writeText(generatedComplaint);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const textArea = document.createElement("textarea");
      textArea.value = generatedComplaint;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const downloadComplaint = () => {
    const blob = new Blob([generatedComplaint], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `complaint_${complaintType}_${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const resetForm = () => {
    setStep(1);
    setComplaintType(null);
    setFormData({
      name: "",
      contact: "",
      date: new Date().toISOString().split("T")[0],
      time: new Date().toLocaleTimeString("en-US", { hour12: false }).slice(0, 5),
      location: "",
      description: "",
      perpetratorDescription: "",
      witnesses: "",
    });
    setGeneratedComplaint("");
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-background/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg bg-card rounded-xl border shadow-xl overflow-hidden max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b shrink-0">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-chart-3" />
            <h2 className="text-lg font-semibold">Quick Complaint Generator</h2>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-muted rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress indicator */}
        <div className="px-4 py-3 border-b bg-muted/30 shrink-0">
          <div className="flex items-center gap-2">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center gap-2">
                <div
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium",
                    step >= s
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  {s}
                </div>
                {s < 3 && (
                  <ChevronRight
                    className={cn(
                      "w-4 h-4",
                      step > s ? "text-primary" : "text-muted-foreground"
                    )}
                  />
                )}
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            {step === 1 && "Select complaint type"}
            {step === 2 && "Fill in details"}
            {step === 3 && "Review and download"}
          </p>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {/* Step 1: Select Type */}
          {step === 1 && (
            <div className="grid grid-cols-2 gap-3">
              {complaintTypes.map((type) => (
                <button
                  key={type.id}
                  onClick={() => {
                    setComplaintType(type.id);
                    setStep(2);
                  }}
                  className={cn(
                    "p-4 rounded-xl border text-left transition-all hover:border-primary hover:bg-primary/5",
                    complaintType === type.id && "border-primary bg-primary/10"
                  )}
                >
                  <type.icon className="w-6 h-6 text-chart-3 mb-2" />
                  <span className="font-medium text-sm">{type.label}</span>
                </button>
              ))}
            </div>
          )}

          {/* Step 2: Fill Details */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium mb-1 block">Your Name</label>
                  <Input
                    value={formData.name}
                    onChange={(e) => updateFormData("name", e.target.value)}
                    placeholder="Full name"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Contact</label>
                  <Input
                    value={formData.contact}
                    onChange={(e) => updateFormData("contact", e.target.value)}
                    placeholder="Phone number"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium mb-1 block">Date</label>
                  <Input
                    type="date"
                    value={formData.date}
                    onChange={(e) => updateFormData("date", e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Time</label>
                  <Input
                    type="time"
                    value={formData.time}
                    onChange={(e) => updateFormData("time", e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">Location</label>
                <Input
                  value={formData.location}
                  onChange={(e) => updateFormData("location", e.target.value)}
                  placeholder="Where did this happen?"
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => updateFormData("description", e.target.value)}
                  placeholder="Describe what happened..."
                  className="w-full min-h-24 p-3 rounded-lg border bg-background resize-none"
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">Perpetrator Description</label>
                <textarea
                  value={formData.perpetratorDescription}
                  onChange={(e) => updateFormData("perpetratorDescription", e.target.value)}
                  placeholder="Describe the person(s) involved..."
                  className="w-full min-h-20 p-3 rounded-lg border bg-background resize-none"
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">Witnesses (if any)</label>
                <Input
                  value={formData.witnesses}
                  onChange={(e) => updateFormData("witnesses", e.target.value)}
                  placeholder="Names and contacts of witnesses"
                />
              </div>

              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                  Back
                </Button>
                <Button onClick={generateComplaint} className="flex-1">
                  Generate Complaint
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Review */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-muted/50 border max-h-64 overflow-y-auto">
                <pre className="text-xs whitespace-pre-wrap font-mono">
                  {generatedComplaint}
                </pre>
              </div>

              <div className="flex gap-3">
                <Button variant="outline" onClick={copyComplaint} className="flex-1">
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 mr-2" />
                      Copy
                    </>
                  )}
                </Button>
                <Button onClick={downloadComplaint} className="flex-1">
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
              </div>

              <Button variant="outline" onClick={resetForm} className="w-full">
                Create Another Complaint
              </Button>

              <div className="p-3 rounded-lg bg-warning/10 border border-warning/20">
                <p className="text-sm text-warning">
                  <strong>Important:</strong> This is a draft template. Please review
                  and modify as needed before submitting to authorities.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
