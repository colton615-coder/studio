**Architecture & Routing**
- `src/app/layout.tsx` wraps every page with `FirebaseClientProvider`, `Toaster`, and manual `ServiceWorkerRegistration`; keep new providers here to preserve auth and PWA order.
- Authenticated surfaces live under `src/app/(app)/**` with `AppLayout` gating on `useUser()` and Firestore onboarding checks; public pages belong under `src/app/(public)`.
- `src/app/page.tsx` hard-redirects to `/dashboard`; add new default landing logic inside dashboard modules instead of changing this redirect.
- The sidebar/nav system is centralized in `src/lib/nav-links.ts`; update that file (and translations if added later) when creating new modules.
- Most dashboard widgets (e.g., `src/components/dashboard/QuickStats.tsx`) assume Suspense boundaries in `dashboard/page.tsx`; keep data loaders Suspense-friendly.

**Firebase & Auth**
- Never edit `initializeFirebase()` in `src/firebase/index.ts`; it handles auto-init vs explicit config based on `NEXT_PUBLIC_FIREBASE_AUTO_INIT`.
- Use hooks exported from `@/firebase` (`useFirebase`, `useUser`, `useFirestore`, `useAuth`) inside `FirebaseProvider`; do not access Firebase SDKs directly in components.
- Firestore requests must surface permission errors through `FirestorePermissionError` to feed the global `FirebaseErrorListener`.
- The onboarding flow writes to `/users/{uid}` and relies on `useUser()`; keep user document schema aligned with `docs/backend.json` and `firestore.rules`.
- Anonymous/email auth flows rely on the "non-blocking" helpers in `src/firebase/non-blocking-login.tsx`; call them without awaiting to keep UI responsive.

**Data Access Patterns**
- Build Firestore refs with `useMemoFirebase()` (see `QuickStats.tsx`); `useCollection`/`useDoc` will throw if passed non-memoized refs.
- `useCollection` defaults to `'once'` reads—opt into `{ mode: 'realtime' }` when live updates are required, as done in `QuickStats`.
- For writes, prefer the non-blocking utilities in `src/firebase/non-blocking-updates.tsx`; they queue offline via `src/lib/offline-queue.ts` and emit permission errors automatically.
- Firestore security is strict about ownership (`firestore.rules`); always include `userProfileId`/`uid` fields exactly as documented in `docs/backend.json`.

**AI & Automation**
- AI flows live in `src/ai/flows/*.ts` and must begin with `'use server';`; they are registered for the Genkit dev server through `src/ai/dev.ts`.
- Instantiate prompts via the shared `ai` client in `src/ai/genkit.ts`, which requires `GOOGLE_GENAI_API_KEY` at runtime.
- Run `npm run genkit:dev` (or `genkit:watch`) to exercise flows locally; each new flow should export a typed function resembling `getBudgetCoaching`.
- Keep AI responses strongly typed with Zod schemas—reuse the pattern in `budget-coach.ts` and update consuming UI to handle validation errors gracefully.

**UI & UX**
- Component primitives are shadcn-based under `src/components/ui`; match existing prop shapes and the neumorphic theme (see `tailwind.config.ts`).
- Sidebar usage requires `SidebarProvider` (`src/components/ui/sidebar.tsx`); never call `useSidebar()` outside that provider.
- PWA status indicators (`NetworkStatusIndicator`, `PullToRefreshIndicator`) expect `usePullToRefresh`/`use-network-status` hooks; wire new pages similarly for consistency.
- Follow the onboarding precedent in `OnboardingFlow.tsx` when extending multi-step modals—persist to Firestore and gate visibility via layout state.
- Use `AICoPilotThinking` for multi-step AI UI feedback loops; it already handles reduced-motion accessibility.

**Offline & PWA**
- Service worker registration is manual (`ServiceWorkerRegistration.tsx`); keep it disabled in dev and respect `NEXT_PUBLIC_DISABLE_PWA` in any new code.
- Cached asset strategy is configured in `next.config.ts` via `withPWA`; coordinate cache keys with the `buildId` logic before changing runtime caching.
- The offline queue relies on IndexedDB; ensure any new queued operation stays under the retry limits defined in `src/lib/offline-queue.ts`.

**Workflows & Tooling**
- Development server runs on port 9002 via `npm run dev`; Turbopack is enabled, so watch for unsupported Next.js patterns.
- Quality gates: `npm run lint`, `npm run typecheck`, and `npm run build`—CI mirrors these scripts, so keep them passing locally.
- Tailwind scans `src/app`, `src/components`, and `src/pages`; place new styles within those paths or update `tailwind.config.ts`.
- Use `npm run dev:lan` for LAN testing (binds to `0.0.0.0`), especially when validating PWA installs on devices.

**Deployment & Env**
- Netlify is the primary target (`netlify.toml`); make sure `NEXT_PUBLIC_FIREBASE_*` env vars are complete and `NEXT_PUBLIC_FIREBASE_AUTO_INIT` stays `false` there.
- For Firebase Hosting, flip `NEXT_PUBLIC_FIREBASE_AUTO_INIT` to `'true'` so auto-config works—no code changes needed.
- Respect `NEXT_DISABLE_PWA` / `NEXT_PUBLIC_DISABLE_PWA` flags when adding features that assume offline caching.
- Coordinate Firestore schema changes with `docs/backend.json` and update `firestore.rules` alongside any new collections.
