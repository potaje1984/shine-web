"use client";

/**
 * useAvailableSlots.ts
 * Consulta Firestore en tiempo real para saber qué franjas
 * horarias ya están ocupadas en una fecha dada.
 *
 * Cuando un cliente reserva las 8:00 AM, esa franja queda
 * bloqueada para los demás clientes.
 */

import { useEffect, useState } from "react";
import {
  collection,
  onSnapshot,
  query,
  where,
} from "firebase/firestore";
import { initFirebase, getFirestoreInstance } from "@/lib/firebase";
import type { OrderDoc } from "@/lib/types";

/** Estados que bloquean la franja (excluimos cancelled y delivered) */
const ACTIVE_STATUSES = ["pending", "picked_up", "in_wash", "ready"];

export function useAvailableSlots(pickupDate: string | null) {
  const [takenSlots, setTakenSlots] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Sin fecha → nada que consultar
    if (!pickupDate) {
      setTakenSlots([]);
      return;
    }

    let cancelled = false;
    let unsub: (() => void) | undefined;

    async function boot() {
      await initFirebase();
      if (cancelled) return;

      const dbInstance = getFirestoreInstance();
      if (!dbInstance) {
        if (!cancelled) setLoading(false);
        return;
      }

      setLoading(true);

      // Consultar órdenes activas en esa fecha
      const q = query(
        collection(dbInstance, "orders"),
        where("pickupDate", "==", pickupDate)
      );

      unsub = onSnapshot(
        q,
        (snap) => {
          if (cancelled) return;

          // Filtrar solo las activas y extraer las horas ocupadas
          const taken = snap.docs
            .map((d) => d.data() as OrderDoc)
            .filter(
              (o) =>
                ACTIVE_STATUSES.includes(o.status) &&
                o.pickupTime
            )
            .map((o) => o.pickupTime as string);

          setTakenSlots(taken);
          setLoading(false);
        },
        (err) => {
          console.warn("[useAvailableSlots] Error:", err);
          if (!cancelled) {
            setTakenSlots([]);
            setLoading(false);
          }
        }
      );
    }

    boot();

    return () => {
      cancelled = true;
      unsub?.();
    };
  }, [pickupDate]);

  return { takenSlots, loading };
}