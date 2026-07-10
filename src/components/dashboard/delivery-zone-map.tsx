"use client";

/**
 * DeliveryZoneMap.tsx
 * Interactive map that shows the delivery zone polygon.
 * Uses browser geolocation to show if user is IN (green) or OUT (red) of the zone.
 * Also allows clicking/tapping on the map to check a specific address.
 */

import { useEffect, useState, useCallback } from "react";
import "leaflet/dist/leaflet.css";
import { MapContainer, TileLayer, Polygon, CircleMarker, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import { MapPin, CheckCircle2, XCircle, Loader2, LocateFixed } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DELIVERY_ZONE_POLYGON,
  MAP_CENTER,
  MAP_DEFAULT_ZOOM,
  isInDeliveryZone,
  ZONE_CENTER,
} from "@/lib/delivery-zone";

// Fix Leaflet default marker icon
// eslint-disable-next-line @typescript-eslint/no-explicit-any
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

interface DeliveryZoneMapProps {
  onZoneStatusChange?: (inZone: boolean, lat: number, lng: number) => void;
  className?: string;
}

type ZoneStatus = "loading" | "in_zone" | "out_zone" | "error" | "idle";

function MapController({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [map, center, zoom]);
  return null;
}

function ClickHandler({ onClick }: { onClick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export function DeliveryZoneMap({ onZoneStatusChange, className = "" }: DeliveryZoneMapProps) {
  const [status, setStatus] = useState<ZoneStatus>("idle");
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [markerPos, setMarkerPos] = useState<[number, number] | null>(null);
  const [inZone, setInZone] = useState<boolean | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const checkLocation = useCallback(
    (lat: number, lng: number) => {
      const inside = isInDeliveryZone(lat, lng);
      setInZone(inside);
      setMarkerPos([lat, lng]);
      setStatus(inside ? "in_zone" : "out_zone");
      setErrorMsg(null);
      onZoneStatusChange?.(inside, lat, lng);
    },
    [onZoneStatusChange]
  );

  const locateUser = useCallback(() => {
    if (!navigator.geolocation) {
      setStatus("error");
      setErrorMsg("Tu navegador no soporta geolocalización");
      return;
    }
    setStatus("loading");
    setErrorMsg(null);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setUserLocation([latitude, longitude]);
        checkLocation(latitude, longitude);
      },
      (err) => {
        setStatus("error");
        switch (err.code) {
          case err.PERMISSION_DENIED:
            setErrorMsg("Permiso de ubicación denegado. Toca el mapa para verificar.");
            break;
          case err.POSITION_UNAVAILABLE:
            setErrorMsg("No se pudo obtener tu ubicación. Toca el mapa.");
            break;
          case err.TIMEOUT:
            setErrorMsg("Tiempo agotado. Intenta de nuevo.");
            break;
          default:
            setErrorMsg("Error al obtener ubicación. Toca el mapa.");
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  }, [checkLocation]);

  useEffect(() => {
    locateUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Status Banner */}
      <div className="flex items-center gap-3 flex-wrap">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={locateUser}
          className="border-white/10 bg-white/5 text-xs gap-1.5 shrink-0"
        >
          <LocateFixed className="h-3.5 w-3.5" />
          Mi ubicación
        </Button>

        {status === "loading" && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Detectando ubicación...
          </div>
        )}

        {status === "in_zone" && (
          <div className="flex items-center gap-2 text-sm text-emerald-400">
            <CheckCircle2 className="h-4 w-4" />
            <span className="font-medium">¡Estás en la zona de entrega!</span>
          </div>
        )}

        {status === "out_zone" && (
          <div className="flex items-center gap-2 text-sm text-red-400">
            <XCircle className="h-4 w-4" />
            <span className="font-medium">Fuera de la zona de entrega</span>
          </div>
        )}

        {status === "error" && errorMsg && (
          <div className="text-xs text-amber-400">{errorMsg}</div>
        )}

        {status === "idle" && (
          <div className="text-xs text-muted-foreground flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5" />
            Toca el mapa o usa tu ubicación
          </div>
        )}
      </div>

      {/* Map */}
      <div className="relative rounded-xl overflow-hidden border border-white/10 h-[280px]">
        <MapContainer
          center={MAP_CENTER}
          zoom={MAP_DEFAULT_ZOOM}
          className="h-full w-full z-0"
          zoomControl={false}
          attributionControl={false}
        >
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

          {/* Delivery zone polygon */}
          <Polygon
            positions={DELIVERY_ZONE_POLYGON}
            pathOptions={{
              color: "#22c55e",
              fillColor: "#22c55e",
              fillOpacity: 0.12,
              weight: 2,
              dashArray: "6 4",
            }}
          />

          <ClickHandler onClick={checkLocation} />

          {/* User GPS location */}
          {userLocation && !markerPos && (
            <CircleMarker
              center={userLocation}
              radius={8}
              pathOptions={{
                color: "#3b82f6",
                fillColor: "#3b82f6",
                fillOpacity: 0.4,
                weight: 2,
              }}
            />
          )}

          {/* Selected/checked marker */}
          {markerPos && (
            <CircleMarker
              center={markerPos}
              radius={10}
              pathOptions={{
                color: inZone ? "#22c55e" : "#ef4444",
                fillColor: inZone ? "#22c55e" : "#ef4444",
                fillOpacity: 0.35,
                weight: 3,
              }}
            />
          )}

          {markerPos && <MapController center={markerPos} zoom={13} />}
          {!markerPos && status === "idle" && <MapController center={ZONE_CENTER} zoom={10} />}
        </MapContainer>
      </div>

      {/* Out of zone warning */}
      {status === "out_zone" && (
        <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-xs text-red-300">
          Tu ubicación está fuera de nuestra zona de entrega. Actualmente solo servimos el norte de Nueva Jersey. Por favor selecciona una dirección dentro de la zona verde del mapa.
        </div>
      )}
    </div>
  );
}