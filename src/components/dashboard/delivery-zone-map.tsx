"use client";

/**
 * DeliveryZoneMap.tsx
 * Shows delivery zone map using OpenStreetMap iframe (no external JS libraries).
 * Uses browser geolocation API to check if user is IN (green) or OUT (red) of zone.
 */

import { useEffect, useState, useCallback } from "react";
import { MapPin, CheckCircle2, XCircle, Loader2, LocateFixed } from "lucide-react";
import { Button } from "@/components/ui/button";
import { isInDeliveryZone, ZONE_CENTER } from "@/lib/delivery-zone";

interface DeliveryZoneMapProps {
  onZoneStatusChange?: (inZone: boolean, lat: number, lng: number) => void;
  className?: string;
}

type ZoneStatus = "loading" | "in_zone" | "out_zone" | "error" | "idle";

export function DeliveryZoneMap({ onZoneStatusChange, className = "" }: DeliveryZoneMapProps) {
  const [status, setStatus] = useState<ZoneStatus>("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [mapUrl, setMapUrl] = useState("");

  // Build the iframe URL - shows North NJ area
  useEffect(() => {
    const [lat, lng] = ZONE_CENTER;
    setMapUrl(
      `https://www.openstreetmap.org/export/embed.html?bbox=${lng - 1.2}%2C${lat - 0.6}%2C${lng + 0.8}%2C${lat + 0.6}&layer=mapnik&marker=${lat}%2C${lng}`
    );
  }, []);

  const locateUser = useCallback(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setStatus("error");
      setErrorMsg("Tu navegador no soporta geolocalización");
      return;
    }
    setStatus("loading");
    setErrorMsg(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const inside = isInDeliveryZone(latitude, longitude);
        setStatus(inside ? "in_zone" : "out_zone");
        onZoneStatusChange?.(inside, latitude, longitude);

        // Update map to center on user location
        setMapUrl(
          `https://www.openstreetmap.org/export/embed.html?bbox=${longitude - 0.15}%2C${latitude - 0.1}%2C${longitude + 0.15}%2C${latitude + 0.1}&layer=mapnik&marker=${latitude}%2C${longitude}`
        );
      },
      (err) => {
        setStatus("error");
        if (err.code === err.PERMISSION_DENIED) {
          setErrorMsg("Permiso de ubicación denegado. Actívalo en tu navegador.");
        } else {
          setErrorMsg("No se pudo obtener tu ubicación. Intenta de nuevo.");
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  }, [onZoneStatusChange]);

  // Auto-detect on mount
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
            Verificando tu ubicación...
          </div>
        )}
      </div>

      {/* Map iframe */}
      <div className="relative rounded-xl overflow-hidden border border-white/10 h-[280px]">
        {mapUrl ? (
          <iframe
            src={mapUrl}
            className="w-full h-full border-0"
            title="Zona de entrega Shine"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-white/[0.02]">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        )}

        {/* Zone overlay indicator */}
        {status === "in_zone" && (
          <div className="absolute top-3 right-3 bg-emerald-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg">
            ✓ EN ZONA
          </div>
        )}
        {status === "out_zone" && (
          <div className="absolute top-3 right-3 bg-red-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg">
            ✗ FUERA DE ZONA
          </div>
        )}
      </div>

      {/* Out of zone warning */}
      {status === "out_zone" && (
        <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-xs text-red-300">
          Tu ubicación está fuera de nuestra zona de entrega. Actualmente solo servimos el norte de Nueva Jersey. Por favor selecciona una dirección dentro de la zona.
        </div>
      )}
    </div>
  );
}