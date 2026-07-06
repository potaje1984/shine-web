"use client";

import { useEffect, useState } from "react";
import {
  collection,
  onSnapshot,
  query,
  where,
  orderBy,
  type QueryConstraint,
} from "firebase/firestore";
import { initFirebase, getFirestoreInstance } from "@/lib/firebase";

export function useCollection<T = Record<string, unknown>>(
  path: string,
  ...constraints: QueryConstraint[]
) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    let unsub: (() => void) | undefined;

    async function boot() {
      await initFirebase();
      if (cancelled) return;

      const dbInstance = getFirestoreInstance();
      if (!dbInstance) {
        if (!cancelled) {
          setLoading(false);
          setError("Firestore not available");
        }
        return;
      }

      const q = constraints.length
        ? query(collection(dbInstance, path), ...constraints)
        : query(collection(dbInstance, path));

      unsub = onSnapshot(
        q,
        (snap) => {
          if (cancelled) return;
          setData(
            snap.docs.map((d) => ({ id: d.id, ...(d.data() as object) })) as T[]
          );
          setLoading(false);
        },
        (err) => {
          console.warn(`[useCollection] Error en ${path}:`, err);
          if (!cancelled) {
            setError(err.message);
            setLoading(false);
          }
        }
      );
    }

    boot();

    return () => {
      cancelled = true;
      if (unsub) {
        unsub();
      }
    };
  }, [path, JSON.stringify(constraints.map(c => Object.entries(c).flat().join(":")))]);

  return { data, loading, error };
}

export { where, orderBy };
