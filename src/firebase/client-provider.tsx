'use client';

import React, { useMemo, useState, useEffect, type ReactNode } from 'react';
import { FirebaseProvider, useUser } from '@/firebase/provider';
import { initializeFirebase } from '@/firebase';
import Splashscreen from '@/components/Splashscreen';

interface FirebaseClientProviderProps {
  children: ReactNode;
}

/**
 * AuthGate component - NO AUTHENTICATION REQUIRED
 * Authentication is only needed for "The Vault" (4-digit PIN)
 * Shows splash screen with daily affirmation during initial load
 */
function AuthGate({ children }: { children: ReactNode }) {
  const { isUserLoading } = useUser();
  const [showSplash, setShowSplash] = useState(true);
  const [minTimeElapsed, setMinTimeElapsed] = useState(false);

  // Ensure splash screen shows for minimum 2.5 seconds to allow animation to complete
  useEffect(() => {
    const timer = setTimeout(() => {
      setMinTimeElapsed(true);
    }, 2500); // 2.5 seconds minimum display time

    return () => clearTimeout(timer);
  }, []);

  // Hide splash only when both Firebase is ready AND minimum time has elapsed
  useEffect(() => {
    if (!isUserLoading && minTimeElapsed) {
      // Add small delay for fade out animation
      const fadeTimer = setTimeout(() => {
        setShowSplash(false);
      }, 300);
      return () => clearTimeout(fadeTimer);
    }
  }, [isUserLoading, minTimeElapsed]);

  // Show splash screen with daily affirmation during initial load
  if (showSplash) {
    return <Splashscreen />;
  }

  // No authentication checks - allow access to all routes
  return <>{children}</>;
}

export function FirebaseClientProvider({ children }: FirebaseClientProviderProps) {
  const firebaseServices = useMemo(() => {
    // Initialize Firebase on the client side, once per component mount.
    return initializeFirebase();
  }, []); // Empty dependency array ensures this runs only once on mount

  return (
    <FirebaseProvider
      firebaseApp={firebaseServices.firebaseApp}
      auth={firebaseServices.auth}
      firestore={firebaseServices.firestore}
    >
      <AuthGate>
        {children}
      </AuthGate>
    </FirebaseProvider>
  );
}