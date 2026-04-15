"use client";

import { useState } from "react";

export default function SOSButton() {
  const [loading, setLoading] = useState(false);

  const handleSOS = async () => {
    setLoading(true);

    try {
      const message = `🚨 EMERGENCY ALERT!
I need help immediately!
Location: https://www.google.com/maps?q=12.899175294270384,77.49661548201726`;

      const res = await fetch("/api/sos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message,
          to: "+918105769243",
        }),
      });

      const data = await res.json();
      console.log("SOS response:", data);

    } catch (err) {
      console.error("SOS failed:", err);
    }

    setLoading(false);
  };

  return (
    <button
      onClick={handleSOS}
      disabled={loading}
      className="
        w-28 h-28
        rounded-full
        bg-red-600
        text-white
        font-bold
        text-xl
        shadow-2xl
        flex
        items-center
        justify-center
        hover:bg-red-700
        active:scale-95
        transition
      "
    >
      {loading ? "..." :  " 🚨SOS"}
    </button>
  );
}