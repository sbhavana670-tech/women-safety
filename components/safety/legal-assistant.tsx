"use client";

import { useState } from "react";
import { LEGAL_INFO } from "@/lib/safety-store";
import {
  Scale,
  Phone,
  Shield,
  FileText,
  X,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Copy,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface LegalAssistantProps {
  isOpen: boolean;
  onClose: () => void;
}

export function LegalAssistant({ isOpen, onClose }: LegalAssistantProps) {
  const [activeTab, setActiveTab] = useState<"numbers" | "rights" | "laws">("numbers");
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [copiedNumber, setCopiedNumber] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedItems(newExpanded);
  };

  const copyNumber = async (number: string) => {
    try {
      await navigator.clipboard.writeText(number);
      setCopiedNumber(number);
      setTimeout(() => setCopiedNumber(null), 2000);
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement("textarea");
      textArea.value = number;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setCopiedNumber(number);
      setTimeout(() => setCopiedNumber(null), 2000);
    }
  };

  const tabs = [
    { id: "numbers", label: "Helplines", icon: Phone },
    { id: "rights", label: "Your Rights", icon: Shield },
    { id: "laws", label: "Laws", icon: FileText },
  ] as const;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-background/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg bg-card rounded-xl border shadow-xl overflow-hidden max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b shrink-0">
          <div className="flex items-center gap-2">
            <Scale className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold">Legal Assistant</h2>
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
                "flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors",
                activeTab === tab.id
                  ? "text-primary border-b-2 border-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {activeTab === "numbers" && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground mb-4">
                These numbers work even without network coverage. Save them offline.
              </p>
              {LEGAL_INFO.emergencyNumbers.map((item) => (
                <div
                  key={item.number}
                  className="p-4 rounded-xl border bg-card hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">{item.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {item.description}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xl font-bold text-primary font-mono">
                        {item.number}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <Button
                      size="sm"
                      className="flex-1"
                      onClick={() => window.open(`tel:${item.number}`)}
                    >
                      <Phone className="w-3 h-3 mr-1" />
                      Call Now
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyNumber(item.number)}
                    >
                      {copiedNumber === item.number ? (
                        <Check className="w-3 h-3" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === "rights" && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground mb-4">
                Know your rights. This information is stored offline for your reference.
              </p>
              {LEGAL_INFO.rights.map((item, index) => (
                <div
                  key={index}
                  className="rounded-xl border overflow-hidden"
                >
                  <button
                    onClick={() => toggleExpand(`right-${index}`)}
                    className="w-full p-4 flex items-center justify-between text-left hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-safe/10">
                        <Shield className="w-4 h-4 text-safe" />
                      </div>
                      <span className="font-medium">{item.title}</span>
                    </div>
                    {expandedItems.has(`right-${index}`) ? (
                      <ChevronUp className="w-4 h-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-muted-foreground" />
                    )}
                  </button>
                  {expandedItems.has(`right-${index}`) && (
                    <div className="px-4 pb-4">
                      <p className="text-sm text-muted-foreground pl-11">
                        {item.description}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {activeTab === "laws" && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground mb-4">
                Important laws for women&apos;s safety and protection.
              </p>
              {LEGAL_INFO.laws.map((item, index) => (
                <div
                  key={index}
                  className="rounded-xl border overflow-hidden"
                >
                  <button
                    onClick={() => toggleExpand(`law-${index}`)}
                    className="w-full p-4 flex items-center justify-between text-left hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <FileText className="w-4 h-4 text-primary" />
                      </div>
                      <span className="font-medium text-sm">{item.title}</span>
                    </div>
                    {expandedItems.has(`law-${index}`) ? (
                      <ChevronUp className="w-4 h-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-muted-foreground" />
                    )}
                  </button>
                  {expandedItems.has(`law-${index}`) && (
                    <div className="px-4 pb-4">
                      <p className="text-sm text-muted-foreground pl-11">
                        {item.description}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t bg-muted/30 shrink-0">
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              All information stored offline
            </p>
            <Button size="sm" variant="ghost" className="text-xs">
              <ExternalLink className="w-3 h-3 mr-1" />
              Learn More
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
