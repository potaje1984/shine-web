#!/bin/bash
set -e
cd /home/z/my-project/shine-web

echo "=== Applying changes ==="

# 1. types.ts - Add house_cleaning, new statuses, cleaning fields
cat > /tmp/types_patch.py << 'PYEOF'
import re

with open('src/lib/types.ts', 'r') as f:
    content = f.read()

# Add house_cleaning to ServiceType
content = content.replace(
    '| "dry_clean";\n// Nota:',
    '| "dry_clean"\n  | "house_cleaning";\n'
)

# Add new OrderStatus values
old_status = '''export type OrderStatus =
  | "pending"
  | "picked_up"
  | "in_wash"
  | "ready"
  | "delivered"
  | "cancelled";'''

new_status = '''export type OrderStatus =
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
  | "completed";'''

content = content.replace(old_status, new_status)

# Add cleaning fields to OrderDoc
old_doc = '''  notes: string | null;
  // Payment'''
new_doc = '''  notes: string | null;
  // Cleaning-specific fields
  cleaningType: string | null;
  cleaningDescription: string | null;
  quotedPrice: number | null;
  quoteAccepted: boolean | null;
  // Payment'''
content = content.replace(old_doc, new_doc)

# Update comments
content = content.replace('weight: number; // Peso en libras (estimado por cliente)', 'weight: number; // Peso en libras (solo lavandería)')
content = content.replace('pricePerPound: number; // Precio por libra', 'pricePerPound: number; // Precio por libra (solo lavandería)')
content = content.replace('total: number; // = weight * pricePerPound (estimado)', 'total: number; // Estimado (lavandería) o precio negociado (limpieza)')

with open('src/lib/types.ts', 'w') as f:
    f.write(content)

print("types.ts patched")
PYEOF
python3 /tmp/types_patch.py

echo "=== Types done ==="

# 2. constants.ts
cat > /tmp/constants_patch.py << 'PYEOF'
with open('src/lib/constants.ts', 'r') as f:
    content = f.read()

# Add new statuses to ORDER_STATUS_CONFIG
old_statuses_end = '''  cancelled: {
    label: "Cancelled",
    color: "text-red-400",
    bg: "bg-red-500/15",
  },
};'''

new_statuses = '''  pending_quote: {
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
};'''

content = content.replace(old_statuses_end, new_statuses)

# Add house_cleaning to SERVICE_TYPE_CONFIG
old_svc_end = '''    pricePerPound: 3.0,
  },
};'''
new_svc_end = '''    pricePerPound: 3.0,
  },
  house_cleaning: {
    label: "House Cleaning",
    description: "Professional home cleaning — quote based on visit",
    pricePerPound: 0,
    icon: "home",
  },
};'''
content = content.replace(old_svc_end, new_svc_end)

# Add CLEANING_TYPES
old_trans_start = '''// ----------------------------------------------------------
// Constantes del negocio
// ----------------------------------------------------------'''
new_trans_start = '''/** Cleaning sub-types for the quote system */
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
// ----------------------------------------------------------'''
content = content.replace(old_trans_start, new_trans_start)

# Update transitions
old_trans = '''export const ORDER_STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending: ["picked_up", "cancelled"],
  picked_up: ["in_wash", "cancelled"],
  in_wash: ["ready", "cancelled"],
  ready: ["delivered"],
  delivered: [],
  cancelled: [],
};'''

new_trans = '''export const ORDER_STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
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
};'''
content = content.replace(old_trans, new_trans)

# Add helpers before PUBLIC_ROUTES
old_public = '''export const PUBLIC_ROUTES = ["/", "/login", "/register", "/test-firebase"];'''
new_public = '''/** Helper: is this a cleaning service type? */
export function isCleaningService(serviceType: ServiceType): boolean {
  return serviceType === "house_cleaning";
}

/** Helper: get the starting status for a service type */
export function getInitialStatus(serviceType: ServiceType): OrderStatus {
  return serviceType === "house_cleaning" ? "pending_quote" : "pending";
}

export const PUBLIC_ROUTES = ["/", "/login", "/register", "/test-firebase", "/how-it-works"];'''
content = content.replace(old_public, new_public)

with open('src/lib/constants.ts', 'w') as f:
    f.write(content)

print("constants.ts patched")
PYEOF
python3 /tmp/constants_patch.py

echo "=== Constants done ==="

# 3. schemas.ts - Add cleaning form schema
cat > /tmp/schemas_patch.py << 'PYEOF'
with open('src/lib/schemas.ts', 'r') as f:
    content = f.read()

cleaning_schema = '''

// ----------------------------------------------------------
// Formulario de limpieza de casa (modelo por cotización)
// ----------------------------------------------------------
export const cleaningFormSchema = z
  .object({
    cleaningType: z.enum(["standard", "deep_clean", "move_in", "post_construction"], {
      message: "Select a cleaning type",
    }),
    cleaningDescription: z
      .string()
      .min(10, "Describe what needs cleaning (at least 10 characters)")
      .max(500, "Maximum 500 characters"),
    address: z.object({
      street: z.string().min(1, "Street is required"),
      city: z.string().min(1, "City is required"),
      zip: z.string().min(1, "Zip code is required"),
    }),
    pickupDate: z.string().min(1, "Select a date for the visit"),
    pickupTime: z.string().min(1, "Select a time for the visit"),
    paymentMethod: z.enum(["cash", "card"], {
      message: "Select a payment method",
    }),
    notes: z.string().optional(),
  })
  .refine(
    (data) => {
      if (!data.pickupDate) return true;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return new Date(data.pickupDate) >= today;
    },
    {
      message: "Date cannot be in the past",
      path: ["pickupDate"],
    }
  );

export type CleaningFormValues = z.infer<typeof cleaningFormSchema>;'''

content = content.replace(
    'export type OrderFormValues = z.infer<typeof orderFormSchema>;',
    'export type OrderFormValues = z.infer<typeof orderFormSchema>;' + cleaning_schema
)

with open('src/lib/schemas.ts', 'w') as f:
    f.write(content)

print("schemas.ts patched")
PYEOF
python3 /tmp/schemas_patch.py

echo "=== Schemas done ==="
echo "=== All patches applied ==="