'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { useSidebarStore } from '@/lib/stores/useSidebarStore';
import { Bot, Menu, PanelLeft } from 'lucide-react';

/**
 * Header Component
 * 
 * This is the persistent header for the application.
 * It should only be rendered once in the app/(app)/layout.tsx.
 * 
 * Features:
 * - Sidebar trigger button (visible on all screen sizes)
 * - App logo and title (mobile only)
 * - Responsive spacing
 */
export function Header() {
  const { toggle } = useSidebarStore();

  return (
    <header className="flex h-14 items-center justify-between border-b border-border px-4">
      <SidebarTrigger asChild>
        <button 
          className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/20 text-primary shadow-neumorphic-outset active:shadow-neumorphic-inset cursor-pointer transition-all hover:bg-primary/30"
          aria-label="Toggle sidebar"
        >
          <Bot className="h-6 w-6 text-accent" />
        </button>
      </SidebarTrigger>
      <div className="flex items-center gap-2 md:hidden">
        <h1 className="text-lg font-bold font-headline text-accent">LiFE-iN-SYNC</h1>
      </div>
      <div className="w-9 md:flex-1" />
    </header>
  );
}
