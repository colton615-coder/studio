'use client';

import React, { useMemo, type ReactNode } from 'react';
import { FirebaseProvider, useUser } from '@/firebase/provider';
import { initializeFirebase } from '@/firebase';
import Splashscreen from '@/components/Splashscreen';
import { usePathname, useRouter } from 'next/navigation';

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

  // Show splash screen with daily affirmation during initial Firebase setup
  if (isUserLoading) {
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