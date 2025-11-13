"use client";

import { useEffect, useMemo, useState, MouseEvent } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Home, CheckCircle, ListTodo, Wallet, Dumbbell, Calendar, ShoppingCart } from "lucide-react";
import { cn } from "@/lib/utils";
import { haptics } from "@/lib/haptics";

type NavItem = {
  href: string;
  label: string;
  icon: typeof Home;
  glowClass: string;
  isActive: (pathname: string) => boolean;
};

const navItems: NavItem[] = [
  {
    href: "/dashboard",
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
    href: "/workouts",
    label: "Workouts",
    icon: Dumbbell,
    glowClass: "shadow-glow-orange",
    isActive: (pathname) => pathname.startsWith("/workouts"),
  },
  {
    href: "/calendar",
    label: "Calendar",
    icon: Calendar,
    glowClass: "shadow-glow-green",
    isActive: (pathname) => pathname.startsWith("/calendar"),
  },
  {
    href: "/shopping",
    label: "Shopping",
    icon: ShoppingCart,
    glowClass: "shadow-glow-blue",
    isActive: (pathname) => pathname.startsWith("/shopping"),
  },
];

export default function BottomNavBar() {
  const pathname = usePathname() ?? "/";
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

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

  return (
    <nav
      role="navigation"
      aria-label="Primary"
      className="fixed bottom-0 left-0 right-0 z-50 mx-auto flex max-w-xl justify-center px-4 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] pt-3"
    >
      <div className="flex w-full items-center justify-between gap-2 rounded-3xl border border-border/40 bg-background/95 px-3 py-2 shadow-neumorphic-outset backdrop-blur-md">
        <div
          className="flex flex-nowrap overflow-x-auto scrollbar-hide w-full gap-2 px-1 snap-x snap-mandatory"
          tabIndex={0}
          aria-label="Module navigation"
          role="list"
        >
          {resolvedNavItems.map(({ href, label, icon: Icon, glowClass, isActive }) => {
            const active = isActive(pathname);
            return (
              <Link
                key={href}
                href={href}
                onClick={handlePress}
                aria-label={label}
                aria-current={active ? "page" : undefined}
                role="listitem"
                className={cn(
                  "group relative flex-none select-none focus-visible:outline-none snap-center",
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
        {/* Optional scroll indicator for mobile UX */}
        <div className="absolute bottom-1 left-0 right-0 h-1 pointer-events-none">
          <div className="w-full h-full bg-gradient-to-r from-transparent via-accent/30 to-transparent" />
        </div>
      </div>
    </nav>
  );
}
