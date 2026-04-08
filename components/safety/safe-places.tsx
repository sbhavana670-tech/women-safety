"use client";

import { useState, useEffect, useMemo } from "react";
import { useSafety } from "@/lib/safety-context";
import { getNearbyPlaces, type SafePlace } from "@/lib/safety-store";
import {
  MapPin,
  Navigation,
  Building2,
  Hospital,
  Shield,
  Home,
  X,
  Phone,
  ExternalLink,
  Wifi,
  WifiOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SafePlacesProps {
  isOpen: boolean;
  onClose: () => void;
}

const placeTypeConfig = {
  police: {
    icon: Shield,
    color: "text-chart-5",
    bgColor: "bg-chart-5/10",
    label: "Police Station",
  },
  hospital: {
    icon: Hospital,
    color: "text-destructive",
    bgColor: "bg-destructive/10",
    label: "Hospital",
  },
  shelter: {
    icon: Home,
    color: "text-primary",
    bgColor: "bg-primary/10",
    label: "Shelter",
  },
  public: {
    icon: Building2,
    color: "text-safe",
    bgColor: "bg-safe/10",
    label: "Public Place",
  },
  custom: {
    icon: MapPin,
    color: "text-warning",
    bgColor: "bg-warning/10",
    label: "Custom",
  },
};

export function SafePlaces({ isOpen, onClose }: SafePlacesProps) {
  const { state, logActivity } = useSafety();
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    const updateOnlineStatus = () => setIsOnline(navigator.onLine);
    window.addEventListener("online", updateOnlineStatus);
    window.addEventListener("offline", updateOnlineStatus);
    updateOnlineStatus();
    return () => {
      window.removeEventListener("online", updateOnlineStatus);
      window.removeEventListener("offline", updateOnlineStatus);
    };
  }, []);

  const nearbyPlaces = useMemo(() => {
    if (!state.currentLocation) return [];
    return getNearbyPlaces(
      state.currentLocation.lat,
      state.currentLocation.lng,
      10
    );
  }, [state.currentLocation]);

  const filteredPlaces = useMemo(() => {
    if (!selectedType) return nearbyPlaces;
    return nearbyPlaces.filter((place) => place.type === selectedType);
  }, [nearbyPlaces, selectedType]);

  const handleNavigate = (place: SafePlace) => {
    logActivity("location", `Navigating to ${place.name}`);
    // Open in Google Maps or Apple Maps
    const url = `https://www.google.com/maps/dir/?api=1&destination=${place.lat},${place.lng}`;
    window.open(url, "_blank");
  };

  const handleCall = (place: SafePlace) => {
    logActivity("location", `Calling ${place.name}`);
    // Simulate call - in real app would use tel: protocol
    alert(`Calling ${place.name}...`);
  };

  const formatDistance = (distance?: number) => {
    if (!distance) return "Unknown";
    if (distance < 1) return `${Math.round(distance * 1000)}m`;
    return `${distance.toFixed(1)}km`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-background/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg bg-card rounded-xl border shadow-xl overflow-hidden max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b shrink-0">
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-safe" />
            <h2 className="text-lg font-semibold">Nearby Safe Places</h2>
          </div>
          <div className="flex items-center gap-2">
            {isOnline ? (
              <div className="flex items-center gap-1 text-xs text-safe">
                <Wifi className="w-3 h-3" />
              </div>
            ) : (
              <div className="flex items-center gap-1 text-xs text-warning">
                <WifiOff className="w-3 h-3" />
                <span>Offline</span>
              </div>
            )}
            <button onClick={onClose} className="p-1 hover:bg-muted rounded-lg">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filter buttons */}
        <div className="p-4 border-b shrink-0">
          <div className="flex gap-2 overflow-x-auto pb-1">
            <button
              onClick={() => setSelectedType(null)}
              className={cn(
                "px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition-colors",
                !selectedType
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted hover:bg-muted/80"
              )}
            >
              All
            </button>
            {Object.entries(placeTypeConfig).map(([type, config]) => (
              <button
                key={type}
                onClick={() => setSelectedType(type)}
                className={cn(
                  "px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition-colors flex items-center gap-1",
                  selectedType === type
                    ? `${config.bgColor} ${config.color}`
                    : "bg-muted hover:bg-muted/80"
                )}
              >
                <config.icon className="w-3 h-3" />
                {config.label}
              </button>
            ))}
          </div>
        </div>

        {/* Places list */}
        <div className="flex-1 overflow-y-auto p-4">
          {!state.currentLocation ? (
            <div className="text-center py-8 text-muted-foreground">
              <MapPin className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Acquiring your location...</p>
              <p className="text-sm">Please enable location services.</p>
            </div>
          ) : filteredPlaces.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Building2 className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No places found nearby</p>
              <p className="text-sm">Try expanding your search radius.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredPlaces.map((place) => {
                const config = placeTypeConfig[place.type];
                const Icon = config.icon;

                return (
                  <div
                    key={place.id}
                    className="p-4 rounded-xl border bg-card hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <div className={cn("p-2 rounded-lg shrink-0", config.bgColor)}>
                        <Icon className={cn("w-5 h-5", config.color)} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h3 className="font-medium truncate">{place.name}</h3>
                            <p className="text-sm text-muted-foreground truncate">
                              {place.address}
                            </p>
                          </div>
                          <div className="text-right shrink-0">
                            <span className={cn("text-sm font-medium", config.color)}>
                              {formatDistance(place.distance)}
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-2 mt-3">
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1"
                            onClick={() => handleNavigate(place)}
                          >
                            <Navigation className="w-3 h-3 mr-1" />
                            Navigate
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleCall(place)}
                          >
                            <Phone className="w-3 h-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleNavigate(place)}
                          >
                            <ExternalLink className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Emergency numbers */}
        <div className="p-4 border-t bg-muted/30 shrink-0">
          <p className="text-xs text-muted-foreground mb-2">Quick Emergency Numbers</p>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              className="flex-1 text-destructive border-destructive/30"
              onClick={() => window.open("tel:100")}
            >
              Police: 100
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="flex-1 text-primary border-primary/30"
              onClick={() => window.open("tel:181")}
            >
              Women: 181
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="flex-1"
              onClick={() => window.open("tel:112")}
            >
              Emergency: 112
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
