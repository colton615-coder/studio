# Firebase Studio

This is a Next.js starter in Firebase Studio.

To get started, take a look at `src/app/page.tsx`.

## Development

- `npm run dev` starts the local dev server (Next.js 15 + Turbopack)
- `npm run build` builds the app
- `npm run start` runs the production build
- `npm run lint` runs eslint on `src`
- `npm run typecheck` runs TypeScript type checks
- `npm run test` runs the test suite with Vitest

## CI/CD

This repository uses GitHub Actions for continuous integration. The CI workflow (`.github/workflows/ci.yml`) runs on all pull requests to `main` and includes:

- **Lint**: ESLint code quality checks
- **Type Check**: TypeScript type validation
- **Test**: Vitest test suite
- **Build**: Production build verification

See `docs/BRANCH_PROTECTION.md` for details on branch protection rules and required status checks.

## Sidebar State (stable)

The app uses the built-in Sidebar context provided by `src/components/ui/sidebar.tsx`.

- Wrap app UI with `SidebarProvider` (see `src/app/(app)/layout.tsx`)
- Access/toggle state anywhere under the provider:

```
import { useSidebar } from '@/components/ui/sidebar'

const { toggleSidebar, open, setOpen, openMobile, setOpenMobile } = useSidebar()
```

Header trigger uses the context directly for maximum reliability:

```
// src/components/Header.tsx
const { toggleSidebar } = useSidebar()
<button type="button" onClick={toggleSidebar}>...</button>
```

Deprecated: The old Zustand store `useSidebarStore` is no longer used and should not be imported.

## Prism Button Component

Interactive jewel-like action buttons are centralized in `src/components/ui/prism-button.tsx` with thin wrappers per domain (`EmeraldPrismButton`, `EmberPrismButton`, `PulsePrismButton`).

Usage:

```tsx
import { PrismButton } from '@/components/ui/prism-button';

<PrismButton
	variant="emerald" // 'emerald' | 'ember' | 'pulse'
	loading={isSaving}
	success={didSucceed}
	icon={<Plus className="w-5 h-5" />}
	onClick={handleCreate}
>
	New Budget
</PrismButton>
```

Props:
- `variant`: color + glow theme.
- `loading`: shows spinner, disables press/haptics, dims surface.
- `success`: triggers particle micro‑animation (auto‑suppressed for reduced motion).
- `icon`: optional leading icon node.
- Standard button props (`disabled`, `onClick`, etc.) are forwarded.

Accessibility & Motion:
- ARIA label auto-derived from child text; override via `label` prop.
- Particle + scale animations respect `prefers-reduced-motion`.

Guidelines:
- Fire `success` only after confirmed async completion.
- Avoid nesting complex layouts inside; keep to short verb phrases.
- Use wrapper components in feature folders when you need local default text.
