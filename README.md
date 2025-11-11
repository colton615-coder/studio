# Firebase Studio

This is a Next.js starter in Firebase Studio.

To get started, take a look at `src/app/page.tsx`.

## Development

- `npm run dev` starts the local dev server (Next.js 15 + Turbopack)
- `npm run build` builds the app
- `npm run start` runs the production build
- `npm run lint` runs eslint on `src`
- `npm run typecheck` runs TypeScript type checks

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
