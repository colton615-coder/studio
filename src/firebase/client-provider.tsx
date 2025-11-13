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
 * AuthGate component handles the authentication flow:
 * - Shows animated splash screen while loading
 * - Redirects to /login if unauthenticated (except for public routes)
 * - Renders children if authenticated
 */
function AuthGate({ children }: { children: ReactNode }) {
  const { user, isUserLoading } = useUser();
  const pathname = usePathname();
  const router = useRouter();

  // Show splash screen during initial auth check
  if (isUserLoading) {
    return <Splashscreen />;
  }

  // Allow access to public routes without authentication
  const publicRoutes = ['/login', '/signup'];
  const isPublicRoute = publicRoutes.some(route => pathname?.startsWith(route));

  // Redirect to login if not authenticated and not on a public route
  if (!user && !isPublicRoute && pathname !== '/') {
    router.push('/login');
    return <Splashscreen />;
  }

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