"use client";

import { useCallback, useEffect, useMemo, useState, MouseEvent, Suspense } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Home, CheckCircle, ListTodo, Wallet, Bot } from "lucide-react";
import { cn } from "@/lib/utils";
import { haptics } from "@/lib/haptics";
import { TodayOverview } from "@/components/dashboard/TodayOverview";
import { QuickStats } from "@/components/dashboard/QuickStats";
import { usePullToRefresh } from "@/hooks/use-pull-to-refresh";
import { PullToRefreshIndicator } from "@/components/ui/pull-to-refresh-indicator";
import { NetworkStatusIndicator } from "@/components/ui/network-status-indicator";
import { ErrorBoundary } from "@/components/error-boundary";
import { Skeleton } from "@/components/ui/skeleton";

type NavItem = {
  href: string;
  label: string;
  icon: typeof Home;
  glowClass: string;
  isActive: (pathname: string) => boolean;
};

const navItems: NavItem[] = [
  {
    href: "/",
    label: "Home",
    icon: Home,
    glowClass: "shadow-glow-purple",
    isActive: (pathname) => pathname === "/" || pathname.startsWith("/dashboard"),
  },
  {
    href: "/habits",
    label: "Habits",
    icon: CheckCircle,
    glowClass: "shadow-glow-green",
    isActive: (pathname) => pathname.startsWith("/habits"),
  },
  {
    href: "/tasks",
    label: "Tasks",
    icon: ListTodo,
    glowClass: "shadow-glow-orange",
    isActive: (pathname) => pathname.startsWith("/tasks"),
  },
  {
    href: "/finance",
    label: "Finance",
    icon: Wallet,
    glowClass: "shadow-glow-blue",
    isActive: (pathname) => pathname.startsWith("/finance"),
  },
  {
    href: "/ai-knox",
    label: "AI Knox",
    icon: Bot,
    glowClass: "shadow-glow-purple",
    isActive: (pathname) => pathname.startsWith("/ai-knox"),
  },
];

function QuickStatsLoading() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
      <Skeleton className="h-32" />
      <Skeleton className="h-32" />
      <Skeleton className="h-32" />
    </div>
  );
}

function TodayOverviewLoading() {
  return (
    <div className="shadow-neumorphic-outset rounded-3xl">
      <div className="p-6 space-y-4">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const pathname = usePathname() ?? "/";
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const handleChange = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches);
    };

    setPrefersReducedMotion(mediaQuery.matches);

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener("change", handleChange);
      return () => mediaQuery.removeEventListener("change", handleChange);
    }

    if (mediaQuery.addListener) {
      mediaQuery.addListener(handleChange);
      return () => mediaQuery.removeListener(handleChange);
    }
  }, []);

  const resolvedNavItems = useMemo(() => navItems, []);

  const handlePress = (_event: MouseEvent<HTMLAnchorElement>) => {
    if (prefersReducedMotion) return;
    haptics.medium();
  };

  const handleRefresh = useCallback(async () => {
    setRefreshKey((prev) => prev + 1);
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }, []);

  const pullToRefresh = usePullToRefresh({
    onRefresh: handleRefresh,
    threshold: 80,
    enabled: true,
  });

  return (
    <div className="flex flex-col gap-6 pb-[calc(env(safe-area-inset-bottom)+2rem)]">
      <PullToRefreshIndicator {...pullToRefresh} />
      <NetworkStatusIndicator onRetry={handleRefresh} />

      <ErrorBoundary>
        <Suspense fallback={<QuickStatsLoading />}>
          <QuickStats key={`stats-${refreshKey}`} />
        </Suspense>
      </ErrorBoundary>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ErrorBoundary>
          <Suspense fallback={<TodayOverviewLoading />}>
            <TodayOverview key={`overview-${refreshKey}`} />
          </Suspense>
        </ErrorBoundary>
      </div>

      <nav
        role="navigation"
        aria-label="Primary"
        className="fixed bottom-0 left-0 right-0 z-50 mx-auto flex max-w-xl justify-center px-4 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] pt-3"
      >
        <div className="flex w-full items-center justify-between gap-2 rounded-3xl border border-border/40 bg-background/95 px-3 py-2 shadow-neumorphic-outset backdrop-blur-md">
          {resolvedNavItems.map(({ href, label, icon: Icon, glowClass, isActive }) => {
            const active = isActive(pathname);
            return (
              <Link
                key={href}
                href={href}
                onClick={handlePress}
                aria-label={label}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "group relative flex-1 select-none focus-visible:outline-none",
                  "focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                )}
              >
                <motion.span
                  className={cn(
                    "flex min-h-[44px] min-w-[44px] flex-col items-center justify-center gap-1 rounded-2xl px-3 py-2 text-xs font-medium tracking-wide transition",
                    active
                      ? cn("text-accent", "shadow-neumorphic-inset", glowClass)
                      : "text-muted-foreground shadow-neumorphic-outset",
                    "bg-background/90"
                  )}
                  whileTap={prefersReducedMotion ? undefined : { scale: 0.94 }}
                  transition={{ type: "spring", stiffness: 450, damping: 32 }}
                >
                  <Icon
                    aria-hidden
                    className={cn(
                      "h-6 w-6",
                      active ? "text-accent" : "text-muted-foreground group-hover:text-foreground"
                    )}
                  />
                  <span className="leading-none">{label}</span>
                </motion.span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
