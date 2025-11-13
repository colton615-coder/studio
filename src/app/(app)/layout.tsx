"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
} from "@/components/ui/sidebar";
import { navLinks } from "@/lib/nav-links";
import { Bot, Loader2 } from "lucide-react";
import { useUser, useFirestore } from "@/firebase";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { OnboardingFlow } from "@/components/onboarding/OnboardingFlow";
import { Header } from "@/components/Header";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user } = useUser();
  const firestore = useFirestore();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [checkingOnboarding, setCheckingOnboarding] = useState(true);

  // NO AUTHENTICATION REQUIRED - user can access app without login
  // Authentication only required for "The Vault" (4-digit PIN)

  useEffect(() => {
    const checkOnboardingStatus = async () => {
      // Skip onboarding if no user (authentication not required)
      if (!user || !firestore) {
        setCheckingOnboarding(false);
        return;
      }

      try {
        const userRef = doc(firestore, "users", user.uid);
        const userDoc = await getDoc(userRef);

        if (!userDoc.exists()) {
          await setDoc(userRef, {
            id: user.uid,
            email: user.email ?? "",
            username: user.displayName ?? user.uid,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            onboardingCompleted: false,
          });
          setShowOnboarding(true);
        } else {
          const data = userDoc.data();
          if (!data?.updatedAt) {
            await setDoc(
              userRef,
              {
                updatedAt: serverTimestamp(),
              },
              { merge: true }
            );
          }
          if (!data?.onboardingCompleted) {
            setShowOnboarding(true);
          }
        }
      } catch {
        // Silently fail - user can still use the app
      } finally {
        setCheckingOnboarding(false);
      }
    };

    if (user && firestore) {
      checkOnboardingStatus();
    } else {
      // No user - skip onboarding check
      setCheckingOnboarding(false);
    }
  }, [user, firestore]);

  // Show minimal loading state only for onboarding check (when user exists)
  if (checkingOnboarding) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:p-4 focus:bg-accent focus:text-accent-foreground focus:rounded-md focus:top-4 focus:left-4"
      >
        Skip to main content
      </a>
      <OnboardingFlow open={showOnboarding} onComplete={() => setShowOnboarding(false)} />
      <SidebarProvider>
        <Sidebar>
          <SidebarHeader>
            <div className="flex items-center gap-2 p-2">
              <Link href="/dashboard">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/20 text-primary shadow-neumorphic-outset cursor-pointer">
                  <Bot className="h-6 w-6 text-accent" />
                </div>
              </Link>
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
                    className={
                      pathname === link.href
                        ? "bg-accent/10 text-accent shadow-neumorphic-inset shadow-glow-green"
                        : "shadow-neumorphic-outset"
                    }
                    tooltip={{
                      children: link.label,
                      className:
                        "shadow-neumorphic-outset text-foreground bg-background border-transparent",
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
          <Header />
          <main
            id="main-content"
            className="min-h-[calc(100vh-3.5rem)] p-4 sm:p-6 lg:p-8 pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)]"
          >
            <div className="max-w-[1400px] mx-auto">{children}</div>
          </main>
        </SidebarInset>
      </SidebarProvider>
    </>
  );
}
