/**
 * schemas.ts
 * Schemas de validación con Zod v4 para formularios de la app.
 * Todos los mensajes de error en español.
 *
 * Se usa junto con react-hook-form + @hookform/resolvers/zod.
 */

import { z } from "zod";

// ----------------------------------------------------------
// Formulario de creación de pedido (modelo por libras)
// ----------------------------------------------------------
export const orderFormSchema = z
  .object({
    serviceType: z.enum(["wash_fold", "dry_clean"], {
      message: "Select a service type",
    }),
    weight: z.coerce
      .number()
      .int()
      .min(20, "Minimum weight is 20 lbs")
      .max(200, "Maximum weight per order is 200 lbs"),
    address: z.object({
      street: z.string().min(1, "Street is required"),
      city: z.string().min(1, "City is required"),
      zip: z.string().min(1, "Zip code is required"),
    }),
    pickupDate: z.string().min(1, "Select a pickup date"),
    pickupTime: z.string().min(1, "Select a pickup time"),
    paymentMethod: z.enum(["cash", "card"], {
      message: "Select a payment method",
    }),
    notes: z.string().optional(),
  })
  // Refinar: la fecha de recolección no puede ser anterior a hoy
  .refine(
    (data) => {
      if (!data.pickupDate) return true;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return new Date(data.pickupDate) >= today;
    },
    {
      message: "Pickup date cannot be in the past",
      path: ["pickupDate"],
    }
  );

export type OrderFormValues = z.infer<typeof orderFormSchema>;

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

export type CleaningFormValues = z.infer<typeof cleaningFormSchema>;

// ----------------------------------------------------------
// Formulario de edición de perfil
// ----------------------------------------------------------
export const profileFormSchema = z.object({
  displayName: z
    .string()
    .min(1, "Name is required")
    .max(50, "Maximum 50 characters"),
  phone: z.string().optional(),
  address: z
    .object({
      street: z.string().min(1, "Street is required"),
      city: z.string().min(1, "City is required"),
      zip: z.string().min(1, "Zip code is required"),
    })
    .nullable()
    .optional(),
});

export type ProfileFormValues = z.infer<typeof profileFormSchema>;