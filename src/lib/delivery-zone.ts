/**
 * delivery-zone.ts
 * Define la zona de cobertura de entrega de Shine.
 * Usa un polígono que cubre el norte de Nueva Jersey.
 * Incluye funciones para verificar si un punto está dentro de la zona.
 */

// Centro del mapa por defecto (North NJ)
export const MAP_CENTER: [number, number] = [40.7484, -74.2461];
export const MAP_DEFAULT_ZOOM = 10;

// Coordenadas del polígono que define la zona de entrega
// Cubre: Bergen, Passaic, Hudson, Essex, Union, Morris (parcial), Middlesex (parcial)
export const DELIVERY_ZONE_POLYGON: [number, number][] = [
  [41.0100, -74.6200],
  [41.0300, -74.4000],
  [41.0000, -74.2000],
  [40.9500, -74.0500],
  [40.8800, -73.9500],
  [40.8300, -73.9000],
  [40.7800, -73.8500],
  [40.7000, -73.8500],
  [40.6500, -73.9500],
  [40.6500, -74.1000],
  [40.6200, -74.2000],
  [40.6000, -74.3000],
  [40.6000, -74.4500],
  [40.6500, -74.5000],
  [40.7000, -74.5000],
  [40.7500, -74.5500],
  [40.8000, -74.6000],
  [40.8500, -74.6500],
  [40.9000, -74.6500],
  [40.9500, -74.6500],
  [41.0100, -74.6200],
];

/**
 * Point-in-polygon test using ray casting algorithm
 */
export function isPointInPolygon(
  lat: number,
  lng: number,
  polygon: [number, number][]
): boolean {
  let inside = false;
  const n = polygon.length;

  for (let i = 0, j = n - 1; i < n; j = i++) {
    const xi = polygon[i][0], yi = polygon[i][1];
    const xj = polygon[j][0], yj = polygon[j][1];

    const intersect =
      yi > lng !== yj > lng &&
      lat < ((xj - xi) * (lng - yi)) / (yj - yi) + xi;

    if (intersect) inside = !inside;
  }

  return inside;
}

/**
 * Check if a given lat/lng is within the delivery zone
 */
export function isInDeliveryZone(lat: number, lng: number): boolean {
  return isPointInPolygon(lat, lng, DELIVERY_ZONE_POLYGON);
}

/**
 * Approximate center of the delivery zone polygon
 */
export const ZONE_CENTER: [number, number] = (() => {
  let sumLat = 0;
  let sumLng = 0;
  DELIVERY_ZONE_POLYGON.forEach(([lat, lng]) => {
    sumLat += lat;
    sumLng += lng;
  });
  const n = DELIVERY_ZONE_POLYGON.length;
  return [sumLat / n, sumLng / n];
})();