'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import {
  getFirestore,
  initializeFirestore,
  type Firestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  memoryLocalCache,
} from 'firebase/firestore'

// IMPORTANT: DO NOT MODIFY THIS FUNCTION
export function initializeFirebase() {
  if (!getApps().length) {
    // Important: Some deploy targets (like Firebase Hosting) can automatically
    // initialize the Firebase App via environment. For other hosts (Vercel, Netlify)
    // we should fall back to the explicit `firebaseConfig` object.
    // To avoid noisy warnings in production, make auto-init opt-in via the
    // `NEXT_PUBLIC_FIREBASE_AUTO_INIT` env var. Set it to 'true' when deploying
    // with Firebase Hosting source-based deploys.
    const shouldAttemptAutoInit = process.env.NEXT_PUBLIC_FIREBASE_AUTO_INIT === 'true'

    let firebaseApp;
    if (shouldAttemptAutoInit) {
      try {
        // Attempt to initialize via Firebase Hosting environment variables
        firebaseApp = initializeApp();
      } catch {
        // If auto-init fails, fall back to explicit config
        firebaseApp = initializeApp(firebaseConfig);
      }
    } else {
      // Do not attempt auto-init; use explicit config to avoid unexpected runtime warnings
      firebaseApp = initializeApp(firebaseConfig);
    }

    return getSdks(firebaseApp);
  }

  // If already initialized, return the SDKs with the already initialized App
  return getSdks(getApp());
}

// Ensure we only configure Firestore persistence once per session
let configuredFirestore: Firestore | null = null;

export function getSdks(firebaseApp: FirebaseApp) {
  // On the client, initialize Firestore with explicit local cache settings
  if (typeof window !== 'undefined') {
    if (!configuredFirestore) {
      try {
        configuredFirestore = initializeFirestore(firebaseApp, {
          localCache: persistentLocalCache({
            tabManager: persistentMultipleTabManager(),
          }),
        });
      } catch {
        // If persistence cannot be enabled (e.g., private mode), fall back to memory cache
        try {
          configuredFirestore = initializeFirestore(firebaseApp, {
            localCache: memoryLocalCache(),
          });
        } catch {
          // As a last resort, get a default Firestore instance
          configuredFirestore = getFirestore(firebaseApp);
        }
      }
    }
  } else {
    // On the server, just get the default Firestore (no persistence)
    configuredFirestore = configuredFirestore ?? getFirestore(firebaseApp);
  }

  const firestore = configuredFirestore ?? getFirestore(firebaseApp);

  return {
    firebaseApp,
    auth: getAuth(firebaseApp),
    firestore,
  };
}

export * from './provider';
export * from './client-provider';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './non-blocking-updates';
export * from './non-blocking-login';
export * from './errors';
export * from './error-emitter';
