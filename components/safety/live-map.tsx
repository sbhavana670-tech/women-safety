"use client";

import { useEffect, useState, useRef, useId } from "react";
import { useSafety } from "@/lib/safety-context";
import { getNearbyPlaces } from "@/lib/safety-store";
import type * as LType from "leaflet";
import {
  MapPin,
  Navigation,
  Crosshair,
  Maximize2,
  Minimize2,
  RefreshCw,
  Wifi,
  WifiOff,
  X,
  Shield,
  Hospital,
  Home,
  Building2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface LiveMapProps {
  isOpen?: boolean;
  onClose?: () => void;
  compact?: boolean;
}

export function LiveMap({ isOpen, onClose, compact = false }: LiveMapProps) {
  const { state, updateLocation, logActivity } = useSafety();
  const uniqueId = useId();
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LType.Map | null>(null);
  const markerRef = useRef<LType.Marker | null>(null);
  const accuracyCircleRef = useRef<LType.Circle | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const initStarted = useRef(false);
  
  const [isOnline, setIsOnline] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [speed, setSpeed] = useState<number | null>(null);
  const [heading, setHeading] = useState<number | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [showSafePlaces, setShowSafePlaces] = useState(true);

  // Check online status
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

  // Initialize map
  useEffect(() => {
    // Prevent double initialization
    if (initStarted.current) return;
    if (!mapContainerRef.current) return;
    if (mapRef.current) return;
    
    // Also check if the container already has a map (Leaflet adds _leaflet_id)
    const container = mapContainerRef.current as HTMLElement & { _leaflet_id?: number };
    if (container._leaflet_id) {
      // Clear for re-init
      delete container._leaflet_id;
    }

    initStarted.current = true;

    const initMap = async () => {
      const L = (await import("leaflet")).default;
      await import("leaflet/dist/leaflet.css");

      // Double-check container is still valid
      if (!mapContainerRef.current || mapRef.current) return;

      // Default to India Gate, New Delhi if no location
      const defaultLat = state.currentLocation?.lat ?? 28.6139;
      const defaultLng = state.currentLocation?.lng ?? 77.209;

      try {
        const map = L.map(mapContainerRef.current!, {
          center: [defaultLat, defaultLng],
          zoom: 16,
          zoomControl: !compact,
        });

      // Add OpenStreetMap tiles
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

      // Custom user marker icon
      const userIcon = L.divIcon({
        className: "custom-marker",
        html: `
          <div style="
            width: 24px;
            height: 24px;
            background: linear-gradient(135deg, #3b82f6, #1d4ed8);
            border: 3px solid white;
            border-radius: 50%;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            display: flex;
            align-items: center;
            justify-content: center;
          ">
            <div style="
              width: 8px;
              height: 8px;
              background: white;
              border-radius: 50%;
            "></div>
          </div>
        `,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });

      // Add user marker
      const marker = L.marker([defaultLat, defaultLng], { icon: userIcon }).addTo(map);
      marker.bindPopup("You are here");
      markerRef.current = marker;

      // Add accuracy circle
      const circle = L.circle([defaultLat, defaultLng], {
        radius: 50,
        color: "#3b82f6",
        fillColor: "#3b82f6",
        fillOpacity: 0.1,
        weight: 2,
      }).addTo(map);
      accuracyCircleRef.current = circle;

      mapRef.current = map;
        setMapLoaded(true);

        // Initial location fetch
        getCurrentLocation();
      } catch (e) {
        // Map already initialized, ignore
        initStarted.current = false;
      }
    };

    initMap();

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
      if (mapRef.current) {
        try {
          mapRef.current.remove();
        } catch (e) {
          // Ignore cleanup errors
        }
        mapRef.current = null;
      }
      initStarted.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Add safe places markers when map is loaded
  useEffect(() => {
    if (!mapRef.current || !mapLoaded || !showSafePlaces || !state.currentLocation) return;

    const addSafePlaceMarkers = async () => {
      const L = (await import("leaflet")).default;
      const places = getNearbyPlaces(state.currentLocation!.lat, state.currentLocation!.lng, 5);

      const iconColors: Record<string, string> = {
        police: "#8b5cf6",
        hospital: "#ef4444",
        shelter: "#3b82f6",
        public: "#22c55e",
        custom: "#f59e0b",
      };

      places.forEach((place) => {
        const color = iconColors[place.type] || "#6b7280";
        const placeIcon = L.divIcon({
          className: "place-marker",
          html: `
            <div style="
              width: 32px;
              height: 32px;
              background: ${color};
              border: 2px solid white;
              border-radius: 50% 50% 50% 0;
              transform: rotate(-45deg);
              box-shadow: 0 2px 6px rgba(0,0,0,0.3);
              display: flex;
              align-items: center;
              justify-content: center;
            ">
              <span style="
                transform: rotate(45deg);
                color: white;
                font-size: 12px;
                font-weight: bold;
              ">${place.type[0].toUpperCase()}</span>
            </div>
          `,
          iconSize: [32, 32],
          iconAnchor: [16, 32],
        });

        L.marker([place.lat, place.lng], { icon: placeIcon })
          .addTo(mapRef.current!)
          .bindPopup(`
            <div style="min-width: 150px;">
              <strong>${place.name}</strong><br/>
              <small>${place.address}</small><br/>
              <small>Distance: ${place.distance?.toFixed(1) || "?"} km</small>
            </div>
          `);
      });
    };

    addSafePlaceMarkers();
  }, [mapLoaded, showSafePlaces, state.currentLocation]);

  // Update map when location changes
  useEffect(() => {
    if (!mapRef.current || !markerRef.current || !state.currentLocation) return;

    const { lat, lng } = state.currentLocation;
    markerRef.current.setLatLng([lat, lng]);
    accuracyCircleRef.current?.setLatLng([lat, lng]);
    mapRef.current.setView([lat, lng], mapRef.current.getZoom());
  }, [state.currentLocation]);

  const getCurrentLocation = () => {
    setIsLoading(true);

    if (!("geolocation" in navigator)) {
      setIsLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy: acc, speed: spd, heading: hdg } = position.coords;
        updateLocation(latitude, longitude);
        setAccuracy(acc);
        setSpeed(spd);
        setHeading(hdg);
        setLastUpdate(new Date());
        setIsLoading(false);
        logActivity("location", "GPS location updated", { lat: latitude, lng: longitude, accuracy: acc });

        if (accuracyCircleRef.current) {
          accuracyCircleRef.current.setRadius(acc);
        }
      },
      (error) => {
        console.log("[v0] Geolocation error:", error.message);
        setIsLoading(false);
        // Fallback to simulated location
        const simLat = 28.6139 + (Math.random() - 0.5) * 0.01;
        const simLng = 77.209 + (Math.random() - 0.5) * 0.01;
        updateLocation(simLat, simLng);
        setLastUpdate(new Date());
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  const startWatchingLocation = () => {
    if (watchIdRef.current !== null) return;

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude, accuracy: acc, speed: spd, heading: hdg } = position.coords;
        updateLocation(latitude, longitude);
        setAccuracy(acc);
        setSpeed(spd);
        setHeading(hdg);
        setLastUpdate(new Date());

        if (accuracyCircleRef.current) {
          accuracyCircleRef.current.setRadius(acc);
        }
      },
      (error) => {
        console.log("[v0] Watch position error:", error.message);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 5000,
      }
    );

    logActivity("location", "Started live GPS tracking");
  };

  const stopWatchingLocation = () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
      logActivity("location", "Stopped live GPS tracking");
    }
  };

  const centerOnUser = () => {
    if (mapRef.current && state.currentLocation) {
      mapRef.current.setView([state.currentLocation.lat, state.currentLocation.lng], 17);
    }
  };

  const formatCoord = (coord: number | undefined) => coord?.toFixed(6) ?? "---";

  // Compact version for dashboard
  if (compact) {
    return (
      <div className="rounded-xl border overflow-hidden bg-card">
        <div className="relative h-48">
          <div ref={mapContainerRef} className="absolute inset-0" />
          
          {/* Overlay controls */}
          <div className="absolute top-2 right-2 z-[1000] flex flex-col gap-1">
            <Button
              size="icon"
              variant="secondary"
              className="h-8 w-8 bg-background/90 backdrop-blur-sm"
              onClick={getCurrentLocation}
              disabled={isLoading}
            >
              <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
            </Button>
            <Button
              size="icon"
              variant="secondary"
              className="h-8 w-8 bg-background/90 backdrop-blur-sm"
              onClick={centerOnUser}
            >
              <Crosshair className="h-4 w-4" />
            </Button>
          </div>

          {/* Status badge */}
          <div className="absolute top-2 left-2 z-[1000]">
            <div className={cn(
              "flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-background/90 backdrop-blur-sm",
              isOnline ? "text-safe" : "text-warning"
            )}>
              {isOnline ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
              {isOnline ? "Live" : "Offline"}
            </div>
          </div>
        </div>

        {/* Info bar */}
        <div className="p-3 border-t bg-muted/30">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="w-3 h-3" />
              <span>
                {state.currentLocation
                  ? `${formatCoord(state.currentLocation.lat)}, ${formatCoord(state.currentLocation.lng)}`
                  : "Acquiring..."}
              </span>
            </div>
            {accuracy && (
              <span className="text-muted-foreground">
                ±{accuracy.toFixed(0)}m
              </span>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Full modal version
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-background">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-[1001] bg-background/95 backdrop-blur-sm border-b">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <MapPin className="w-5 h-5 text-primary" />
            <div>
              <h2 className="font-semibold">Live GPS Map</h2>
              <p className="text-xs text-muted-foreground">
                {lastUpdate ? `Updated: ${lastUpdate.toLocaleTimeString()}` : "Acquiring location..."}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isOnline ? (
              <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-safe/10 text-safe text-xs">
                <Wifi className="w-3 h-3" />
                Online
              </div>
            ) : (
              <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-warning/10 text-warning text-xs">
                <WifiOff className="w-3 h-3" />
                Offline
              </div>
            )}
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Map container */}
      <div ref={mapContainerRef} className="absolute inset-0 pt-16 pb-32" />

      {/* Map controls */}
      <div className="absolute right-4 top-24 z-[1000] flex flex-col gap-2">
        <Button
          size="icon"
          variant="secondary"
          className="bg-background/90 backdrop-blur-sm shadow-lg"
          onClick={getCurrentLocation}
          disabled={isLoading}
        >
          <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
        </Button>
        <Button
          size="icon"
          variant="secondary"
          className="bg-background/90 backdrop-blur-sm shadow-lg"
          onClick={centerOnUser}
        >
          <Crosshair className="h-4 w-4" />
        </Button>
        <Button
          size="icon"
          variant="secondary"
          className={cn(
            "bg-background/90 backdrop-blur-sm shadow-lg",
            watchIdRef.current !== null && "bg-primary text-primary-foreground"
          )}
          onClick={() => {
            if (watchIdRef.current !== null) {
              stopWatchingLocation();
            } else {
              startWatchingLocation();
            }
          }}
        >
          <Navigation className="h-4 w-4" />
        </Button>
      </div>

      {/* Bottom info panel */}
      <div className="absolute bottom-0 left-0 right-0 z-[1001] bg-background/95 backdrop-blur-sm border-t">
        <div className="p-4 space-y-3">
          {/* Coordinates */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-primary" />
              <span className="font-mono text-sm">
                {state.currentLocation
                  ? `${formatCoord(state.currentLocation.lat)}, ${formatCoord(state.currentLocation.lng)}`
                  : "Acquiring location..."}
              </span>
            </div>
            <Button variant="outline" size="sm" onClick={getCurrentLocation} disabled={isLoading}>
              <RefreshCw className={cn("w-3 h-3 mr-1", isLoading && "animate-spin")} />
              Refresh
            </Button>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-2 rounded-lg bg-muted/50 text-center">
              <p className="text-xs text-muted-foreground">Accuracy</p>
              <p className="font-medium">{accuracy ? `±${accuracy.toFixed(0)}m` : "---"}</p>
            </div>
            <div className="p-2 rounded-lg bg-muted/50 text-center">
              <p className="text-xs text-muted-foreground">Speed</p>
              <p className="font-medium">
                {speed !== null ? `${(speed * 3.6).toFixed(1)} km/h` : "---"}
              </p>
            </div>
            <div className="p-2 rounded-lg bg-muted/50 text-center">
              <p className="text-xs text-muted-foreground">Heading</p>
              <p className="font-medium">{heading !== null ? `${heading.toFixed(0)}°` : "---"}</p>
            </div>
          </div>

          {/* Toggle safe places */}
          <div className="flex items-center justify-between">
            <span className="text-sm">Show Safe Places</span>
            <Button
              variant={showSafePlaces ? "default" : "outline"}
              size="sm"
              onClick={() => setShowSafePlaces(!showSafePlaces)}
            >
              {showSafePlaces ? "Visible" : "Hidden"}
            </Button>
          </div>

          {/* Live tracking toggle */}
          <Button
            className="w-full"
            variant={watchIdRef.current !== null ? "destructive" : "default"}
            onClick={() => {
              if (watchIdRef.current !== null) {
                stopWatchingLocation();
              } else {
                startWatchingLocation();
              }
            }}
          >
            <Navigation className="w-4 h-4 mr-2" />
            {watchIdRef.current !== null ? "Stop Live Tracking" : "Start Live Tracking"}
          </Button>
        </div>
      </div>
    </div>
  );
}
