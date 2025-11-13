"use client";
import { motion } from "framer-motion";
import { PlusCircle, Flame } from "lucide-react";
import { haptics } from "@/lib/haptics";
import { cn } from "@/lib/utils";
import React from "react";

interface EmberPrismButtonProps {
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
  children?: React.ReactNode;
  label?: string;
  icon?: 'plus' | 'flame';
}

export const EmberPrismButton: React.FC<EmberPrismButtonProps> = ({
  onClick,
  className,
  disabled,
  children,
  label = "New Habit",
  icon = 'plus'
}) => {
  const IconComp = icon === 'plus' ? PlusCircle : Flame;
  return (
    <motion.button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={() => { if (disabled) return; haptics.light(); onClick?.(); }}
      whileHover={{ scale: disabled ? 1 : 1.05, boxShadow: disabled ? "none" : "0 0 16px rgba(249,115,22,0.45)" }}
      whileTap={{ scale: disabled ? 1 : 0.95 }}
      className={cn(
        "relative overflow-hidden rounded-xl px-6 py-3 bg-gradient-to-br from-orange-500/30 via-amber-600/30 to-red-700/40 border border-orange-500/30 shadow-neu-outset backdrop-blur-md group select-none transition-colors disabled:opacity-50 disabled:cursor-not-allowed active-press neu-noise",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2",
        className
      )}
    >
      <div className="absolute inset-0 bg-orange-400/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      <div className="pointer-events-none absolute -inset-[120%] bg-gradient-to-r from-transparent via-amber-200/25 to-transparent rotate-12 group-hover:animate-sheen" />
      <div className="relative flex items-center gap-2 text-amber-100 font-medium tracking-wide drop-shadow-[0_0_6px_rgba(249,115,22,0.55)]">
        <IconComp className="w-5 h-5" />
        <span>{children || "New Habit"}</span>
      </div>
    </motion.button>
  );
};
