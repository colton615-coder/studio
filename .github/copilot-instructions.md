**App Surface & Routing**
- Next.js App Router wraps the entire tree in `src/app/layout.tsx`; keep provider order (`FirebaseClientProvider` → children → `Toaster` → `ServiceWorkerRegistration`) so auth loads before UI chrome.
- Authenticated pages live under `src/app/(app)`; `AppLayout` enforces `useUser()` gating, redirects unauthenticated users to `/login`, and bootstraps a `/users/{uid}` doc/onboarding state when missing.
- Public pages belong in `src/app/(public)`; `src/app/page.tsx` hard-redirects to `/dashboard`, so route-level landing tweaks belong inside dashboard modules instead.
- All sidebar/nav items come from `src/lib/nav-links.ts`; update both the flat list and group metadata to surface new modules in the shell.

**Firebase & Auth**
- `initializeFirebase()` in `src/firebase/index.ts` is environment-aware—never modify it and always import Firebase pieces from `@/firebase` to reuse the configured instances.
- `FirebaseProvider` exposes hooks (`useFirebase`, `useUser`, `useFirestore`, `useAuth`) and renders `FirebaseErrorListener`; emit `FirestorePermissionError` via `errorEmitter` so global boundaries can react.
- Auth flows are intentionally non-blocking; call helpers in `src/firebase/non-blocking-login.tsx` without awaiting and rely on `onAuthStateChanged` for state changes.
- Keep onboarding writes aligned with `docs/backend.json`/`firestore.rules`; `AppLayout` expects an `onboardingCompleted` flag on each user document.

**Firestore Reads**
- Always wrap collection/query factories in `useMemoFirebase` (see `src/components/dashboard/QuickStats.tsx`); `useCollection` and `useDoc` throw if the reference lacks the injected `__memo` marker.
- `useCollection` defaults to `'once'` reads; opt into `{ mode: 'realtime' }` for live dashboards and ensure surrounding components stay Suspense-friendly.
- `useDoc` mirrors the memoization requirement for single documents and surfaces permission errors through the shared emitter.
- Align document shapes with `docs/backend.json`; Firestore security rules assume explicit ownership fields (`uid`, `userProfileId`).

**Writes, Offline & Errors**
- Use the non-blocking helpers in `src/firebase/non-blocking-updates.tsx`; they defer promises, enqueue network failures in `src/lib/offline-queue.ts`, and retry up to three times.
- On permission failures, emit `FirestorePermissionError` so `FirebaseErrorListener` can escalate to the nearest error boundary.
- When adding new queued writes, include all rule-mandated identifiers so retries pass Firestore validation.

**UI & UX**
- Shadcn-based primitives live in `src/components/ui`; preserve existing props, spacing, and neumorphic shadows, or update `tailwind.config.ts` if you need new tokens.
- `SidebarProvider` in `src/app/(app)/layout.tsx` owns sidebar state; never call `useSidebar()` outside that tree and reuse header triggers from `src/components/Header.tsx`.
- Multi-step flows should follow `src/components/onboarding/OnboardingFlow.tsx`: persist completion to Firestore and toggle visibility from layout state.
- `ServiceWorkerRegistration.tsx` registers PWAs only in production and honors `NEXT_PUBLIC_DISABLE_PWA`; avoid duplicate registrations in feature components.

**AI & Automation**
- Each flow in `src/ai/flows/*.ts` starts with `'use server';`, uses the shared `ai` client from `src/ai/genkit.ts`, and gets registered in `src/ai/dev.ts` for Genkit dev servers.
- Run `npm run genkit:dev` or `npm run genkit:watch` when iterating on flows and ensure `GOOGLE_GENAI_API_KEY` is present in your environment.

**Workflows & Tooling**
- `npm run dev` serves the app on port 9002 via Turbopack; use `npm run dev:lan` to bind to `0.0.0.0` for device/PWA testing.
- CI gates mirror local scripts: `npm run lint`, `npm run typecheck`, `npm run build`.
- Tailwind scans `src/app`, `src/components`, and `src/pages`; keep new styles inside these roots or extend the scan config.
