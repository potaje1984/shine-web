/**
 * constants.ts
 * Enums, labels, colores y configuración centralizada.
 * Referencia visual para la UI: badges, selects, tablas.
 */

import type {
  OrderStatus,
  PaymentStatus,
  PaymentMethod,
  ServiceType,
} from "./types";

// ----------------------------------------------------------
// Status: label + color para la UI
// ----------------------------------------------------------
export const ORDER_STATUS_CONFIG: Record<
  OrderStatus,
  { label: string; color: string; bg: string }
> = {
  pending: {
    label: "Pending",
    color: "text-amber-400",
    bg: "bg-amber-500/15",
  },
  picked_up: {
    label: "Picked Up",
    color: "text-blue-400",
    bg: "bg-blue-500/15",
  },
  in_wash: {
    label: "Washing",
    color: "text-cyan-400",
    bg: "bg-cyan-500/15",
  },
  ready: {
    label: "Ready",
    color: "text-emerald-400",
    bg: "bg-emerald-500/15",
  },
  delivered: {
    label: "Delivered",
    color: "text-green-400",
    bg: "bg-green-500/15",
  },
  pending_quote: {
    label: "Awaiting Quote",
    color: "text-amber-400",
    bg: "bg-amber-500/15",
  },
  quoted: {
    label: "Quoted",
    color: "text-blue-400",
    bg: "bg-blue-500/15",
  },
  accepted: {
    label: "Accepted",
    color: "text-indigo-400",
    bg: "bg-indigo-500/15",
  },
  in_progress: {
    label: "In Progress",
    color: "text-cyan-400",
    bg: "bg-cyan-500/15",
  },
  completed: {
    label: "Completed",
    color: "text-green-400",
    bg: "bg-green-500/15",
  },
  cancelled: {
    label: "Cancelled",
    color: "text-red-400",
    bg: "bg-red-500/15",
  },
};

export const PAYMENT_STATUS_CONFIG: Record<
  PaymentStatus,
  { label: string; color: string; bg: string }
> = {
  pending: {
    label: "Pending",
    color: "text-amber-400",
    bg: "bg-amber-500/15",
  },
  completed: {
    label: "Completed",
    color: "text-emerald-400",
    bg: "bg-emerald-500/15",
  },
  failed: {
    label: "Failed",
    color: "text-red-400",
    bg: "bg-red-500/15",
  },
  refunded: {
    label: "Refunded",
    color: "text-purple-400",
    bg: "bg-purple-500/15",
  },
};

export const PAYMENT_METHOD_CONFIG: Record<
  PaymentMethod,
  { label: string; icon: string }
> = {
  cash: { label: "Cash", icon: "💵" },
  card: { label: "Card", icon: "💳" },
  transfer: { label: "Transfer", icon: "🏦" },
  wallet: { label: "Wallet", icon: "📱" },
};

export const SERVICE_TYPE_CONFIG: Record<
  ServiceType,
  { label: string; description: string; pricePerPound: number }
> = {
  wash_fold: {
    label: "Wash & Fold",
    description: "Standard wash with drying and folding",
    pricePerPound: 1.5,
  },
  dry_clean: {
    label: "Dry Cleaning",
    description: "Dry cleaning for delicate garments",
    pricePerPound: 3.0,
  },
  house_cleaning: {
    label: "House Cleaning",
    description: "Professional home cleaning — quote based on visit",
    pricePerPound: 0,
    icon: "home",
  },
};

/** Cleaning sub-types for the quote system */
export const CLEANING_TYPES: Record<string, { label: string; description: string }> = {
  standard: {
    label: "Standard Cleaning",
    description: "Regular home cleaning — kitchen, bathrooms, floors, dusting",
  },
  deep_clean: {
    label: "Deep Cleaning",
    description: "Thorough deep cleaning — inside appliances, baseboards, windows",
  },
  move_in: {
    label: "Move In/Out",
    description: "Complete cleaning for moving in or out of a home",
  },
  post_construction: {
    label: "Post-Construction",
    description: "Cleaning after remodeling or construction work",
  },
};

// ----------------------------------------------------------
// Constantes del negocio
// ----------------------------------------------------------
/** Peso mínimo en libras para aceptar un pedido */
export const MIN_WEIGHT_LBS = 20;

/** Precio por defecto por libra (lavado estándar) */
export const DEFAULT_PRICE_PER_POUND = 1.5;

// ----------------------------------------------------------
// Horario de atención y franjas horarias
// ----------------------------------------------------------
/** Hora de inicio (24h) */
export const BUSINESS_HOUR_START = 8;
/** Hora de fin (24h, exclusivo) */
export const BUSINESS_HOUR_END = 18;
/** Intervalo en minutos entre franjas */
export const SLOT_INTERVAL_MINUTES = 60;
/** Órdenes máximas por franja horaria (1 = bloqueo total) */
export const MAX_ORDERS_PER_SLOT = 1;

/**
 * Genera todas las franjas horarias disponibles.
 * Ejemplo: ["08:00", "09:00", ..., "17:00"]
 */
export function generateTimeSlots(): string[] {
  const slots: string[] = [];
  for (let h = BUSINESS_HOUR_START; h < BUSINESS_HOUR_END; h++) {
    slots.push(`${String(h).padStart(2, "0")}:00`);
  }
  return slots;
}

/**
 * Convierte "08:00" → "8:00 AM", "14:00" → "2:00 PM"
 */
export function formatTimeSlot(slot: string): string {
  const [h, m] = slot.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const displayH = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${displayH}:${String(m).padStart(2, "0")} ${period}`;
}

// ----------------------------------------------------------
// Status transitions (admin workflow)
// pending → picked_up → in_wash → ready → delivered
// Any non-delivered status → cancelled
// ----------------------------------------------------------
export const ORDER_STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending: ["picked_up", "cancelled"],
  pending_quote: ["quoted", "cancelled"],
  quoted: ["accepted", "cancelled"],
  accepted: ["in_progress", "cancelled"],
  in_progress: ["completed", "cancelled"],
  completed: [],
  picked_up: ["in_wash", "cancelled"],
  in_wash: ["ready", "cancelled"],
  ready: ["delivered"],
  delivered: [],
  cancelled: [],
};

// ----------------------------------------------------------
// Navegación del dashboard (cliente)
// ----------------------------------------------------------
export const DASHBOARD_NAV = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: "LayoutDashboard",
  },
  {
    label: "Orders",
    href: "/dashboard/orders",
    icon: "ShoppingBag",
  },
  {
    label: "Settings",
    href: "/dashboard/settings",
    icon: "Settings",
  },
] as const;

// ----------------------------------------------------------
// Navegación del admin (mobile bottom nav)
// ----------------------------------------------------------
export const ADMIN_NAV = [
  {
    label: "Home",
    href: "/admin",
    icon: "Home",
  },
  {
    label: "Orders",
    href: "/admin/orders",
    icon: "ShoppingBag",
  },
  {
    label: "Settings",
    href: "/admin/settings",
    icon: "Settings",
  },
] as const;

// ----------------------------------------------------------
// Rutas públicas
// ----------------------------------------------------------
/** Helper: is this a cleaning service type? */
export function isCleaningService(serviceType: ServiceType): boolean {
  return serviceType === "house_cleaning";
}

/** Helper: get the starting status for a service type */
export function getInitialStatus(serviceType: ServiceType): OrderStatus {
  return serviceType === "house_cleaning" ? "pending_quote" : "pending";
}

export const PUBLIC_ROUTES = ["/", "/login", "/register", "/test-firebase", "/how-it-works"];
export const AUTH_ROUTES = ["/login", "/register"];
export const PROTECTED_ROUTE_PREFIX = "/dashboard";
export const ADMIN_ROUTE_PREFIX = "/admin";