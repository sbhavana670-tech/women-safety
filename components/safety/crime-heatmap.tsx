"use client";

import { useState, useEffect, useRef, useId } from "react";
import { useSafety } from "@/lib/safety-context";
import { X, AlertTriangle, Shield, Navigation, Layers, Info, Car } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type * as L from "leaflet";

interface CrimeHeatmapProps {
  isOpen?: boolean;
  onClose?: () => void;
  compact?: boolean;
}

// Simulated crime data for demo
const CRIME_HOTSPOTS = [
  { lat: 12.9716, lng: 77.5946, intensity: 0.9, type: "High Risk Zone", incidents: 45 },
  { lat: 12.9616, lng: 77.6046, intensity: 0.7, type: "Moderate Risk", incidents: 23 },
  { lat: 12.9816, lng: 77.5846, intensity: 0.8, type: "High Risk Zone", incidents: 38 },
  { lat: 12.9516, lng: 77.6146, intensity: 0.5, type: "Low Risk", incidents: 12 },
  { lat: 12.9916, lng: 77.5746, intensity: 0.6, type: "Moderate Risk", incidents: 18 },
  { lat: 12.9416, lng: 77.5646, intensity: 0.4, type: "Low Risk", incidents: 8 },
  { lat: 12.9556, lng: 77.5896, intensity: 0.85, type: "High Risk Zone", incidents: 42 },
  { lat: 12.9756, lng: 77.6196, intensity: 0.3, type: "Safe Zone", incidents: 3 },
];

const SAFE_ZONES = [
  { lat: 12.9656, lng: 77.5996, name: "Police Station", type: "police" },
  { lat: 12.9856, lng: 77.5896, name: "Hospital", type: "hospital" },
  { lat: 12.9456, lng: 77.6096, name: "Fire Station", type: "fire" },
];

export function CrimeHeatmap({ isOpen, onClose, compact = false }: CrimeHeatmapProps) {
  const { state, updateLocation } = useSafety();
  const uniqueId = useId();
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<unknown>(null);
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [showSafeZones, setShowSafeZones] = useState(true);
  const [selectedHotspot, setSelectedHotspot] = useState<typeof CRIME_HOTSPOTS[0] | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(
    state?.currentLocation || null
  );
  const [mounted, setMounted] = useState(false);
  const [travelMode, setTravelMode] = useState(false); // For cab/bus travel

  useEffect(() => {
    setMounted(true);
    // Get user location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const loc = { lat: position.coords.latitude, lng: position.coords.longitude };
          setUserLocation(loc);
          updateLocation(loc.lat, loc.lng);
        },
        () => {
          // Default to Bangalore if geolocation fails
          setUserLocation({ lat: 12.9716, lng: 77.5946 });
        },
        { timeout: 5000 }
      );
    }
  }, [updateLocation]);

  useEffect(() => {
    if (!mounted || !mapContainerRef.current) return;
    if (!isOpen && !compact) return;
    if (mapRef.current) return;
    
    // Check if the container already has a map
    const container = mapContainerRef.current as HTMLElement & { _leaflet_id?: number };
    if (container._leaflet_id) {
      // Clear the old map
      delete container._leaflet_id;
    }

    let mapInstance: unknown = null;

    const initMap = async () => {
      const leaflet = (await import("leaflet")).default;
      await import("leaflet/dist/leaflet.css");
      
      if (!mapContainerRef.current || mapRef.current) return;

      const defaultCenter: [number, number] = userLocation 
        ? [userLocation.lat, userLocation.lng] 
        : [12.9716, 77.5946];

      try {
        const map = leaflet.map(mapContainerRef.current, {
          center: defaultCenter,
          zoom: compact ? 13 : 14,
          zoomControl: !compact,
        });

        leaflet.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: '&copy; OpenStreetMap',
          maxZoom: 19,
        }).addTo(map);

        mapRef.current = map;
        mapInstance = map;
      } catch (e) {
        // Map already initialized, ignore
      }
    };

    initMap();

    return () => {
      if (mapInstance && typeof (mapInstance as { remove: () => void }).remove === 'function') {
        try {
          (mapInstance as { remove: () => void }).remove();
        } catch (e) {
          // Ignore cleanup errors
        }
      }
      mapRef.current = null;
    };
  }, [mounted, isOpen, compact, userLocation]);

  // Add markers and heatmap circles
  useEffect(() => {
    if (!mapRef.current) return;
    
    const addMarkers = async () => {
      const leaflet = (await import("leaflet")).default;
      const map = mapRef.current as unknown as L.Map;
      if (!map) return;

      // Clear existing layers (except tile layer)
      map.eachLayer((layer) => {
        if (layer instanceof leaflet.Marker || layer instanceof leaflet.Circle) {
          map.removeLayer(layer);
        }
      });

      // Add user marker
      if (userLocation) {
        const userIcon = leaflet.divIcon({
          className: "custom-marker",
          html: `<div style="width: 20px; height: 20px; background: #3b82f6; border: 3px solid white; border-radius: 50%; box-shadow: 0 2px 8px rgba(0,0,0,0.3);"></div>`,
          iconSize: [20, 20],
          iconAnchor: [10, 10],
        });
        leaflet.marker([userLocation.lat, userLocation.lng], { icon: userIcon })
          .addTo(map)
          .bindPopup("Your Location");
      }

      // Add crime hotspots
      if (showHeatmap) {
        CRIME_HOTSPOTS.forEach((hotspot) => {
          const color = hotspot.intensity > 0.7 
            ? "rgba(239, 68, 68, 0.4)" 
            : hotspot.intensity > 0.4 
            ? "rgba(251, 191, 36, 0.4)" 
            : "rgba(34, 197, 94, 0.3)";
          
          const circle = leaflet.circle([hotspot.lat, hotspot.lng], {
            radius: hotspot.intensity * 500,
            color: hotspot.intensity > 0.7 ? "#ef4444" : hotspot.intensity > 0.4 ? "#f59e0b" : "#22c55e",
            fillColor: color,
            fillOpacity: 0.6,
            weight: 2,
          }).addTo(map);

          circle.on("click", () => {
            setSelectedHotspot(hotspot);
          });
        });
      }

      // Add safe zones
      if (showSafeZones) {
        SAFE_ZONES.forEach((zone) => {
          const icon = leaflet.divIcon({
            className: "custom-marker",
            html: `<div style="width: 32px; height: 32px; background: #22c55e; border: 3px solid white; border-radius: 8px; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 8px rgba(0,0,0,0.3);">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="white" stroke="white" stroke-width="2">
                <path d="M12 22s-8-4.5-8-11.8A8 8 0 0 1 12 2a8 8 0 0 1 8 8.2c0 7.3-8 11.8-8 11.8z"/>
                <circle cx="12" cy="10" r="3" fill="#22c55e"/>
              </svg>
            </div>`,
            iconSize: [32, 32],
            iconAnchor: [16, 32],
          });
          leaflet.marker([zone.lat, zone.lng], { icon })
            .addTo(map)
            .bindPopup(`<strong>${zone.name}</strong><br/>Safe Zone`);
        });
      }
    };

    addMarkers();
  }, [showHeatmap, showSafeZones, userLocation]);

  const getRiskLevel = () => {
    if (!userLocation) return { level: "Unknown", color: "text-muted-foreground" };
    
    // Check proximity to hotspots
    let maxIntensity = 0;
    CRIME_HOTSPOTS.forEach((hotspot) => {
      const distance = Math.sqrt(
        Math.pow(userLocation.lat - hotspot.lat, 2) + 
        Math.pow(userLocation.lng - hotspot.lng, 2)
      );
      if (distance < 0.02) {
        maxIntensity = Math.max(maxIntensity, hotspot.intensity);
      }
    });

    if (maxIntensity > 0.7) return { level: "High Risk", color: "text-destructive" };
    if (maxIntensity > 0.4) return { level: "Moderate", color: "text-warning" };
    return { level: "Safe", color: "text-safe" };
  };

  const risk = getRiskLevel();

  if (!mounted) return null;

  // Compact view for dashboard
  if (compact) {
    return (
      <div className="rounded-2xl overflow-hidden border border-border bg-card">
        <div className="p-3 border-b border-border bg-card flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-warning" />
            <span className="font-medium text-sm">Crime Heatmap</span>
            {travelMode && (
              <span className="px-2 py-0.5 bg-primary/10 text-primary text-xs rounded-full flex items-center gap-1">
                <Car className="w-3 h-3" />
                Travel Mode
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setTravelMode(!travelMode)}
              className={cn(
                "p-1.5 rounded-lg transition-colors",
                travelMode ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/80"
              )}
              title="Enable for cab/bus travel"
            >
              <Car className="w-3 h-3" />
            </button>
            <span className={cn("text-xs font-medium", risk.color)}>
              {risk.level}
            </span>
          </div>
        </div>
        <div ref={mapContainerRef} className="h-48 w-full" />
        {travelMode && (
          <div className="p-2 bg-primary/5 border-t border-border">
            <p className="text-xs text-center text-muted-foreground">
              Travel mode active - Showing crime hotspots along routes
            </p>
          </div>
        )}
      </div>
    );
  }

  // Full modal view
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-2xl max-h-[90vh] bg-card rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden animate-fade-in-up">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-warning/10 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-warning" />
            </div>
            <div>
              <h2 className="font-semibold text-foreground">Crime Heatmap</h2>
              <p className="text-xs text-muted-foreground">View safety zones and risk areas</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full">
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Map controls */}
        <div className="p-3 border-b border-border flex items-center justify-between bg-muted/30">
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant={showHeatmap ? "default" : "outline"}
              size="sm"
              onClick={() => setShowHeatmap(!showHeatmap)}
              className="gap-2"
            >
              <Layers className="w-4 h-4" />
              Hotspots
            </Button>
            <Button
              variant={showSafeZones ? "default" : "outline"}
              size="sm"
              onClick={() => setShowSafeZones(!showSafeZones)}
              className="gap-2"
            >
              <Shield className="w-4 h-4" />
              Safe Zones
            </Button>
            <Button
              variant={travelMode ? "default" : "outline"}
              size="sm"
              onClick={() => setTravelMode(!travelMode)}
              className={cn("gap-2", travelMode && "bg-primary")}
            >
              <Car className="w-4 h-4" />
              Cab/Bus Mode
            </Button>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              if (userLocation && mapRef.current) {
                (mapRef.current as { setView: (coords: [number, number], zoom: number) => void }).setView([userLocation.lat, userLocation.lng], 14);
              }
            }}
            className="gap-2"
          >
            <Navigation className="w-4 h-4" />
            Center
          </Button>
        </div>
        
        {/* Travel mode notice */}
        {travelMode && (
          <div className="p-2 bg-primary/10 border-b border-border flex items-center justify-center gap-2">
            <Car className="w-4 h-4 text-primary" />
            <span className="text-sm text-primary font-medium">
              Travel Mode Active - Showing crime hotspots for cab/bus routes
            </span>
          </div>
        )}

        {/* Map */}
        <div ref={mapContainerRef} className="h-80 w-full" />

        {/* Risk assessment */}
        <div className="p-4 border-t border-border">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-foreground">Current Area Risk</span>
            <span className={cn("px-3 py-1 rounded-full text-sm font-semibold", 
              risk.level === "High Risk" ? "bg-destructive/10 text-destructive" :
              risk.level === "Moderate" ? "bg-warning/10 text-warning" :
              "bg-safe/10 text-safe"
            )}>
              {risk.level}
            </span>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-destructive/60" />
              <span>High Risk</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-warning/60" />
              <span>Moderate</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-safe/60" />
              <span>Safe Zone</span>
            </div>
          </div>
        </div>

        {/* Selected hotspot info */}
        {selectedHotspot && (
          <div className="p-4 border-t border-border bg-muted/30">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="font-medium text-foreground">{selectedHotspot.type}</p>
                <p className="text-sm text-muted-foreground">
                  {selectedHotspot.incidents} incidents reported in this area
                </p>
                <Button 
                  size="sm" 
                  variant="link" 
                  className="p-0 h-auto mt-1"
                  onClick={() => setSelectedHotspot(null)}
                >
                  Dismiss
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
