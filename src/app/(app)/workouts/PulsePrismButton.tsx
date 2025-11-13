"use client";
import { motion } from "framer-motion";
import { PlayCircle, Activity } from "lucide-react";
import { haptics } from "@/lib/haptics";
import { cn } from "@/lib/utils";
import React from "react";

interface PulsePrismButtonProps {
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
  children?: React.ReactNode;
  label?: string;
  icon?: 'play' | 'pulse';
}

export const PulsePrismButton: React.FC<PulsePrismButtonProps> = ({
  onClick,
  className,
  disabled,
  children,
  label = "Start Workout",
  icon = 'play'
}) => {
  const IconComp = icon === 'play' ? PlayCircle : Activity;
  return (
    <motion.button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={() => { if (disabled) return; haptics.light(); onClick?.(); }}
      whileHover={{ scale: disabled ? 1 : 1.05, boxShadow: disabled ? "none" : "0 0 18px rgba(139,92,246,0.45)" }}
      whileTap={{ scale: disabled ? 1 : 0.95 }}
      className={cn(
        "relative overflow-hidden rounded-xl px-8 py-4 bg-gradient-to-br from-fuchsia-600/30 via-purple-600/30 to-indigo-700/40 border border-purple-500/40 shadow-neu-outset backdrop-blur-md group select-none transition-colors disabled:opacity-50 disabled:cursor-not-allowed active-press neu-noise",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400 focus-visible:ring-offset-2",
        className
      )}
    >
      <div className="absolute inset-0 bg-purple-400/15 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      <div className="pointer-events-none absolute -inset-[120%] bg-gradient-to-r from-transparent via-purple-300/25 to-transparent rotate-12 group-hover:animate-sheen" />
      <div className="relative flex items-center gap-3 text-purple-100 font-semibold tracking-wide drop-shadow-[0_0_6px_rgba(168,85,247,0.55)] text-lg">
        <IconComp className="w-6 h-6" />
        <span>{children || "Start Workout"}</span>
      </div>
    </motion.button>
  );
};
