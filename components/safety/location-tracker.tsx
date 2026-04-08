"use client";

import { useEffect, useState } from "react";
import { useSafety } from "@/lib/safety-context";
import { MapPin, Navigation, Wifi, WifiOff, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export function LocationTracker() {
  const { state, updateLocation, logActivity } = useSafety();
  const [isOnline, setIsOnline] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  useEffect(() => {
    const updateOnlineStatus = () => {
      setIsOnline(navigator.onLine);
    };

    window.addEventListener("online", updateOnlineStatus);
    window.addEventListener("offline", updateOnlineStatus);
    updateOnlineStatus();

    return () => {
      window.removeEventListener("online", updateOnlineStatus);
      window.removeEventListener("offline", updateOnlineStatus);
    };
  }, []);

  const getLocation = async () => {
    setIsLoading(true);
    try {
      if ("geolocation" in navigator) {
        const position = await new Promise<GeolocationPosition>(
          (resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              enableHighAccuracy: true,
              timeout: 10000,
              maximumAge: 0,
            });
          }
        );
        
        updateLocation(position.coords.latitude, position.coords.longitude);
        setLastUpdate(new Date());
        logActivity("location", "Location updated", {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      } else {
        // Simulate location for demo
        const simulatedLat = 28.6139 + (Math.random() - 0.5) * 0.01;
        const simulatedLng = 77.209 + (Math.random() - 0.5) * 0.01;
        updateLocation(simulatedLat, simulatedLng);
        setLastUpdate(new Date());
        logActivity("location", "Simulated location updated");
      }
    } catch {
      // Fallback to simulated location
      const simulatedLat = 28.6139 + (Math.random() - 0.5) * 0.01;
      const simulatedLng = 77.209 + (Math.random() - 0.5) * 0.01;
      updateLocation(simulatedLat, simulatedLng);
      setLastUpdate(new Date());
    }
    setIsLoading(false);
  };

  useEffect(() => {
    getLocation();
    const interval = setInterval(getLocation, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const formatCoord = (coord: number | undefined) => {
    return coord?.toFixed(6) ?? "---";
  };

  return (
    <div className="p-4 rounded-xl bg-card border">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <MapPin className="w-5 h-5 text-primary" />
          <h3 className="font-semibold">Location</h3>
        </div>
        <div className="flex items-center gap-2">
          {isOnline ? (
            <div className="flex items-center gap-1 text-xs text-safe">
              <Wifi className="w-3 h-3" />
              <span>Online</span>
            </div>
          ) : (
            <div className="flex items-center gap-1 text-xs text-warning">
              <WifiOff className="w-3 h-3" />
              <span>Offline</span>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
          <Navigation className="w-5 h-5 text-primary" />
          <div className="flex-1">
            <div className="text-sm font-medium">
              {state.currentLocation ? (
                <>
                  {formatCoord(state.currentLocation.lat)},{" "}
                  {formatCoord(state.currentLocation.lng)}
                </>
              ) : (
                "Acquiring location..."
              )}
            </div>
            {lastUpdate && (
              <div className="text-xs text-muted-foreground">
                Last updated: {lastUpdate.toLocaleTimeString()}
              </div>
            )}
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={getLocation}
            disabled={isLoading}
          >
            <RefreshCw
              className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`}
            />
          </Button>
        </div>

        {!isOnline && (
          <div className="p-2 rounded-lg bg-warning/10 border border-warning/20">
            <p className="text-xs text-warning">
              You are offline. Location is cached and will sync when online.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
