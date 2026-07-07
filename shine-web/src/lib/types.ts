/**
 * types.ts
 * Tipos centralizados para la plataforma Shine.
 * Fuente de verdad para todos los componentes y hooks.
 */

// ----------------------------------------------------------
// Enums (string unions para type-safety)
// ----------------------------------------------------------
export type UserRole = "customer" | "admin";

export type OrderStatus =
  | "pending"
  | "pending_quote"
  | "quoted"
  | "accepted"
  | "in_progress"
  | "completed"
  | "picked_up"
  | "in_wash"
  | "ready"
  | "delivered"
  | "cancelled";

export type CleaningStatus =
  | "pending_quote"
  | "quoted"
  | "accepted"
  | "in_progress"
  | "completed";

export type PaymentStatus =
  | "pending"
  | "completed"
  | "failed"
  | "refunded";

export type PaymentMethod =
  | "cash"
  | "card"
  | "transfer"
  | "wallet";

export type ServiceType =
  | "wash_fold"
  | "dry_clean"
  | "house_cleaning";

// ----------------------------------------------------------
// Firestore Documents
// ----------------------------------------------------------
export interface UserDoc {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  phone: string | null;
  address: Address | null;
  metadata: Record<string, unknown>;
  createdAt: string; // ISO string (Firestore Timestamp serializado)
  updatedAt: string;
}

export interface Address {
  street: string;
  city: string;
  zip: string;
}

export interface OrderItem {
  name: string;
  quantity: number;
  unitPrice: number;
}

export type OrderPaymentMethod = "cash" | "card";

export type OrderPaymentStatus =
  | "pending"        // Esperando cobro
  | "card_saved"     // Tarjeta guardada (SetupIntent confirmado)
  | "paid"           // Pagado (PaymentIntent confirmado)
  | "paid_cash"      // Pagado en efectivo (marcado por admin)
  | "failed"         // Falló el cargo
  | "refunded";      // Reembolsado

export interface OrderDoc {
  id: string; // Document ID (se agrega al mapear desde Firestore)
  userId: string;
  serviceType: ServiceType;
  status: OrderStatus;
  items: OrderItem[]; // Para compatibilidad, contiene un item representando el servicio
  weight: number; // Peso en libras (solo lavandería)
  confirmedWeight: number | null; // Peso confirmado por admin al recoger
  pricePerPound: number; // Precio por libra (solo lavandería)
  total: number; // Estimado (lavandería) o precio negociado (limpieza)
  confirmedTotal: number | null; // = confirmedWeight * pricePerPound (cobrado real)
  currency: string;
  pickupDate: string | null;
  pickupTime: string | null; // "08:00", "09:00", etc.
  deliveryDate: string | null;
  deliveryPhotoUrl: string | null;
  address: Address | null;
  notes: string | null;
  // Cleaning-specific fields
  cleaningType: string | null;
  cleaningDescription: string | null;
  quotedPrice: number | null;
  quoteAccepted: boolean | null;
  // Payment
  paymentMethod: OrderPaymentMethod | null;
  paymentStatus: OrderPaymentStatus;
  stripeCustomerId: string | null;      // cus_XXX from Stripe
  stripePaymentMethodId: string | null; // pm_XXX from Stripe
  stripeSetupIntentId: string | null;  // seti_XXX
  stripePaymentIntentId: string | null; // pi_XXX
  // Timestamps
  createdAt: string;
  updatedAt: string;
}

export interface PaymentDoc {
  id: string;
  userId: string;
  orderId: string;
  amount: number;
  currency: string;
  method: PaymentMethod;
  status: PaymentStatus;
  transactionId: string | null;
  createdAt: string;
  updatedAt: string;
}

// ----------------------------------------------------------
// Notifications
// ----------------------------------------------------------
export type NotificationType =
  | "order_status"
  | "payment"
  | "system";

export interface NotificationDoc {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  read: boolean;
  // Context (e.g. orderId to navigate)
  orderId?: string;
  // If true, all admins see this notification
  forAdmin?: boolean;
  createdAt: string;
}

// ----------------------------------------------------------
// Form / UI types
// ----------------------------------------------------------
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  displayName?: string;
  phone?: string;
  address?: Address | null;
}

export interface OrderFilters {
  status?: OrderStatus;
  userId?: string;
}

// ----------------------------------------------------------
// Auth context
// ----------------------------------------------------------
export interface AuthState {
  user: {
    uid: string;
    email: string | null;
    displayName: string | null;
  } | null;
  profile: UserDoc | null;
  loading: boolean;
  error: string | null;
  isAdmin: boolean;
}