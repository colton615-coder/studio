'use client';
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
} from '@/components/ui/sidebar';
import { navLinks } from '@/lib/nav-links';
import { cn } from '@/lib/utils';
import { Bot } from 'lucide-react';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <div className="flex items-center gap-2 p-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/20 text-primary shadow-neumorphic-outset">
              <Bot className="h-6 w-6 text-accent" />
            </div>
            <h1 className="text-xl font-bold font-headline text-accent">LiFE-iN-SYNC</h1>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            {navLinks.map((link) => (
              <SidebarMenuItem key={link.href}>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === link.href}
                  className={cn(
                    'shadow-neumorphic-outset active:shadow-neumorphic-inset',
                    pathname === link.href && 'bg-accent/10 text-accent shadow-neumorphic-inset'
                  )}
                  tooltip={{
                    children: link.label,
                    className: "shadow-neumorphic-outset text-foreground bg-background border-transparent"
                  }}
                >
                  <Link href={link.href}>
                    <link.icon className="h-5 w-5" />
                    <span>{link.label}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>
      </Sidebar>
      <SidebarInset>
        <main className="min-h-screen p-4 sm:p-6 lg:p-8">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
