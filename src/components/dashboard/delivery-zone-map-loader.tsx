"use client";

/**
 * delivery-zone-map-loader.tsx
 * Dynamic wrapper to avoid SSR issues with Leaflet (requires `window`).
 */

import dynamic from "next/dynamic";

const DeliveryZoneMap = dynamic(
  () => import("./delivery-zone-map").then((mod) => mod.DeliveryZoneMap),
  {
    ssr: false,
    loading: () => (
      <div className="h-[280px] rounded-xl border border-white/10 bg-white/[0.02] flex items-center justify-center">
        <div className="text-sm text-muted-foreground animate-pulse">
          Cargando mapa...
        </div>
      </div>
    ),
  }
);

export { DeliveryZoneMap };