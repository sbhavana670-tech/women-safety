"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export default function SOSButton() {
  const [loading, setLoading] = useState(false);

  const handleSOS = () => {
    setLoading(true);

    console.log("SOS triggered... waiting 3 seconds");

    setTimeout(async () => {
      try {
        const message = `🚨 EMERGENCY ALERT!
I need help immediately!
Location: https://www.google.com/maps?q=12.899175294270384,77.49661548201726`;

        const phoneNumber = "+919380858533";

        // ✅ 1. SEND SMS
        const smsRes = await fetch("/api/send-sms", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            message,
            to: [phoneNumber],
          }),
        });

        const smsData = await smsRes.json();
        console.log("SMS response:", smsData);

        // ✅ 2. MAKE CALL
        const callRes = await fetch("/api/make-call", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            to: phoneNumber,
          }),
        });

        const callData = await callRes.json();
        console.log("Call response:", callData);

      } catch (err) {
        console.error("SOS failed:", err);
      }

      setLoading(false);
    }, 3000);
  };

  return (
    <Button onClick={handleSOS} disabled={loading} className="bg-red-600">
      {loading ? "Sending..." : "SOS"}
    </Button>
  );
}