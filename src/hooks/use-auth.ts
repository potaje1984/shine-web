"use client";

/**
 * useAuth.ts
 * Hook reactivo para sesión de Firebase Auth.
 * Usa initFirebase() para garantizar que Firebase esté listo
 * antes de subscribirse a onAuthStateChanged.
 */

import { useEffect, useState, useCallback, useRef } from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut as fbSignOut,
  updateProfile,
  getAdditionalUserInfo,
  sendPasswordResetEmail,
  type User,
  type AuthProvider,
} from "firebase/auth";
import { GoogleAuthProvider, FacebookAuthProvider, OAuthProvider } from "firebase/auth";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { initFirebase, getAuthInstance, getFirestoreInstance } from "@/lib/firebase";
import type { UserDoc, Address } from "@/lib/types";

export { type UserDoc };

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserDoc | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const unsubRef = useRef<(() => void) | null>(null);

  /**
   * Carga el documento de perfil desde Firestore.
   * Se usa en el boot y también como refreshProfile() público.
   */
  const loadProfile = useCallback(async (uid: string, signal: { cancelled: boolean }) => {
    const dbInstance = getFirestoreInstance();
    if (!dbInstance || signal.cancelled) return;

    try {
      const snap = await getDoc(doc(dbInstance, "users", uid));
      if (signal.cancelled) return;
      setProfile(snap.exists() ? (snap.data() as UserDoc) : null);
    } catch (e) {
      console.warn("[useAuth] Could not load profile:", e);
      if (!signal.cancelled) setProfile(null);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    const signal = { cancelled: false };
    const originalSet = signal;

    async function boot() {
      // Esperar a que Firebase esté inicializado
      await initFirebase();

      if (cancelled) return;

      const authInstance = getAuthInstance();
      const dbInstance = getFirestoreInstance();

      if (!authInstance) {
        console.warn("[useAuth] Firebase Auth not available after initFirebase");
        if (!cancelled) setLoading(false);
        return;
      }

      const handleUser = async (fbUser: User | null) => {
        if (cancelled) return;
        setUser(fbUser);

        if (fbUser && dbInstance) {
          await loadProfile(fbUser.uid, signal);
        } else {
          if (!cancelled) setProfile(null);
        }
        if (!cancelled) setLoading(false);
      };

      const unsub = onAuthStateChanged(authInstance, handleUser);
      unsubRef.current = unsub;
    }

    boot();

    return () => {
      cancelled = true;
      originalSet.cancelled = true;
      unsubRef.current?.();
    };
  }, [loadProfile]);

  const signUp = useCallback(
    async ({
      email,
      password,
      displayName,
      phone,
      address,
    }: {
      email: string;
      password: string;
      displayName?: string;
      phone?: string;
      address?: Address | null;
    }) => {
      await initFirebase();
      const authInstance = getAuthInstance();
      const dbInstance = getFirestoreInstance();

      if (!authInstance || !dbInstance) throw new Error("Firebase not initialized. Reload the page.");
      setError(null);
      try {
        const cred = await createUserWithEmailAndPassword(authInstance, email, password);
        if (displayName) await updateProfile(cred.user, { displayName });
        await setDoc(doc(dbInstance, "users", cred.user.uid), {
          uid: cred.user.uid,
          email,
          displayName: displayName || "",
          role: "customer",
          phone: phone || null,
          address: address || null,
          metadata: {},
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
        return cred.user;
      } catch (e: any) {
        setError(e.message);
        throw e;
      }
    },
    []
  );

  const signIn = useCallback(
    async ({ email, password }: { email: string; password: string }) => {
      await initFirebase();
      const authInstance = getAuthInstance();

      if (!authInstance) throw new Error("Firebase not initialized. Reload the page.");
      setError(null);
      try {
        const cred = await signInWithEmailAndPassword(authInstance, email, password);
        return cred.user;
      } catch (e: any) {
        setError(e.message);
        throw e;
      }
    },
    []
  );

  const signOut = useCallback(async () => {
    await initFirebase();
    const authInstance = getAuthInstance();
    if (!authInstance) return;
    await fbSignOut(authInstance);
  }, []);

  /**
   * Envía un email de restablecimiento de contraseña.
   */
  const resetPassword = useCallback(
    async (email: string) => {
      await initFirebase();
      const authInstance = getAuthInstance();
      if (!authInstance) throw new Error("Firebase not initialized. Reload the page.");
      setError(null);
      try {
        await sendPasswordResetEmail(authInstance, email);
      } catch (e: any) {
        setError(e.message);
        throw e;
      }
    },
    []
  );

  /**
   * Actualiza el perfil del usuario en Firestore.
   * También actualiza displayName en Firebase Auth.
   */
  const updateProfileData = useCallback(
    async (data: { displayName?: string; phone?: string | null; address?: Address | null }) => {
      await initFirebase();
      const authInstance = getAuthInstance();
      const dbInstance = getFirestoreInstance();

      if (!authInstance || !dbInstance) throw new Error("Firebase not initialized.");
      if (!user) throw new Error("No active session.");

      // Actualizar displayName en Auth
      if (data.displayName && data.displayName !== user.displayName) {
        await updateProfile(user, { displayName: data.displayName });
      }

      // Actualizar documento en Firestore
      const updates: Partial<UserDoc> = {
        displayName: data.displayName || "",
        phone: data.phone ?? null,
        address: data.address ?? null,
        updatedAt: new Date().toISOString(),
      };

      await updateDoc(doc(dbInstance, "users", user.uid), updates);

      // Recargar perfil en el estado local
      await loadProfile(user.uid, { cancelled: false });
    },
    [user, loadProfile]
  );

  /**
   * Fuerza la recarga del perfil desde Firestore.
   */
  const refreshProfile = useCallback(async () => {
    if (!user) return;
    await loadProfile(user.uid, { cancelled: false });
  }, [user, loadProfile]);

  /**
   * Sign in with a social provider (Google, Facebook, Apple).
   * Creates Firestore profile on first login.
   */
  const signInWithProvider = useCallback(
    async (providerName: "google" | "facebook" | "apple") => {
      await initFirebase();
      const authInstance = getAuthInstance();
      const dbInstance = getFirestoreInstance();

      if (!authInstance || !dbInstance) throw new Error("Firebase not initialized. Reload the page.");
      setError(null);

      let provider: AuthProvider;
      switch (providerName) {
        case "google":
          provider = new GoogleAuthProvider();
          break;
        case "facebook":
          provider = new FacebookAuthProvider();
          break;
        case "apple":
          provider = new OAuthProvider("apple.com");
          provider.addScope("email");
          provider.addScope("name");
          break;
      }

      try {
        const result = await signInWithPopup(authInstance, provider);
        const fbUser = result.user;
        const additionalInfo = getAdditionalUserInfo(result);

        // Si es primer login, crear perfil en Firestore
        if (additionalInfo?.isNewUser) {
          await setDoc(doc(dbInstance, "users", fbUser.uid), {
            uid: fbUser.uid,
            email: fbUser.email || "",
            displayName: fbUser.displayName || "",
            role: "customer",
            phone: null,
            address: null,
            metadata: {
              provider: providerName,
              photoURL: fbUser.photoURL || null,
            },
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
        }

        return fbUser;
      } catch (e: any) {
        // Si el usuario cierra el popup, no es un error real
        if (e.code === "auth/popup-closed-by-user") {
          return null;
        }
        setError(e.message);
        throw e;
      }
    },
    []
  );

  return {
    user,
    profile,
    loading,
    error,
    isAdmin: profile?.role === "admin",
    signIn,
    signUp,
    signInWithProvider,
    signOut,
    resetPassword,
    updateProfile: updateProfileData,
    refreshProfile,
  };
}