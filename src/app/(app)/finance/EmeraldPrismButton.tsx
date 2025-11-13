"use client";
import { motion } from "framer-motion";
import { Plus } from "lucide-react";
import { haptics } from "@/lib/haptics";
import { cn } from "@/lib/utils";
import React from "react";

interface EmeraldPrismButtonProps {
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
  children?: React.ReactNode;
  label?: string; // for aria-label override
}

export const EmeraldPrismButton: React.FC<EmeraldPrismButtonProps> = ({
  onClick,
  className,
  disabled,
  children,
  label = "New Budget",
}) => {
  return (
    <motion.button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={() => {
        if (disabled) return;
        haptics.light();
        onClick?.();
      }}
      whileHover={{ scale: disabled ? 1 : 1.05, boxShadow: disabled ? "none" : "0 0 20px rgba(16,185,129,0.4)" }}
      whileTap={{ scale: disabled ? 1 : 0.95 }}
      className={cn(
        "relative overflow-hidden rounded-xl px-6 py-3 bg-gradient-to-br from-emerald-500/30 via-emerald-600/30 to-teal-700/40 border border-emerald-500/30 shadow-neu-outset backdrop-blur-md group select-none transition-colors disabled:opacity-50 disabled:cursor-not-allowed",
        "active-press",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2",
        "neu-noise",
        className
      )}
    >
      {/* Inner glow */}
      <div className="absolute inset-0 bg-emerald-400/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      {/* Animated sheen */}
      <div className="pointer-events-none absolute -inset-[120%] bg-gradient-to-r from-transparent via-emerald-300/20 to-transparent rotate-12 group-hover:animate-[sheen_2.2s_ease-in-out_infinite]" />
      <div className="relative flex items-center gap-2 text-emerald-100 font-medium tracking-wide drop-shadow-[0_0_6px_rgba(16,185,129,0.6)]">
        <Plus className="w-5 h-5" />
        <span>{children || "New Budget"}</span>
      </div>
    </motion.button>
  );
};

// Keyframe for sheen animation (inject via style tag or global css if desired)
// Using inline <style> injection is avoided here; assumed global.css can be extended.
