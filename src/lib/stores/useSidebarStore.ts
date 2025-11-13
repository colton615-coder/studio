/**
 * @deprecated The LiFE-iN-SYNC shell now relies on `SidebarProvider` (`src/app/(app)/layout.tsx`).
 * This legacy hook remains so older imports fail loudly with a migration hint instead of silently.
 */
export interface SidebarStore {
  isOpen: boolean;
  toggle: () => void;
  setOpen: (open: boolean) => void;
}

export function useSidebarStore(): SidebarStore {
  throw new Error(
    'useSidebarStore is deprecated. Wrap UI in <SidebarProvider> and use the context hooks instead.'
  );
}
