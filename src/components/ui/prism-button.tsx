"use client";
import React, { useEffect, useRef } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { haptics } from '@/lib/haptics';
import { cn } from '@/lib/utils';

export type PrismVariant = 'emerald' | 'ember' | 'pulse';

interface PrismButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'onDrag' | 'onDragStart' | 'onDragEnd' | 'onDragEnter' | 'onDragLeave' | 'onDragOver' | 'onDrop' | 'onDragCapture' | 'onDragStartCapture' | 'onDragEndCapture' | 'onDragEnterCapture' | 'onDragLeaveCapture' | 'onDragOverCapture' | 'onDropCapture'> {
  variant?: PrismVariant;
  loading?: boolean;
  success?: boolean;
  icon?: React.ReactNode;
  label?: string;
  compact?: boolean;
  disableHaptics?: boolean;
}

const gradientStyles: Record<PrismVariant, string> = {
  emerald: 'from-emerald-500/30 via-emerald-600/30 to-teal-700/40 border-emerald-500/30 text-emerald-100 focus-visible:ring-emerald-400',
  ember: 'from-orange-500/30 via-amber-600/30 to-red-700/40 border-orange-500/30 text-amber-100 focus-visible:ring-orange-400',
  pulse: 'from-fuchsia-600/30 via-purple-600/30 to-indigo-700/40 border-purple-500/40 text-purple-100 focus-visible:ring-purple-400'
};

const glowShadow: Record<PrismVariant, string> = {
  emerald: '0 0 20px rgba(16,185,129,0.4)',
  ember: '0 0 16px rgba(249,115,22,0.45)',
  pulse: '0 0 18px rgba(168,85,247,0.45)'
};

export const PrismButton: React.FC<PrismButtonProps> = ({
  variant = 'emerald',
  loading = false,
  success = false,
  icon,
  label,
  compact = false,
  disableHaptics = false,
  className,
  onClick,
  children,
  ...rest
}) => {
  const prefersReducedMotion = useReducedMotion();
  const prevLoading = useRef(false);

  // Fire success haptics when loading transitions to false and success true
  useEffect(() => {
    if (prevLoading.current && !loading && success && !disableHaptics) {
      try { haptics.success(); } catch {}
    }
    prevLoading.current = loading;
  }, [loading, success, disableHaptics]);

  return (
    <motion.button
      type="button"
      aria-label={label || (typeof children === 'string' ? children : 'Prism Button')}
      disabled={rest.disabled || loading}
      onClick={(e) => {
        if (!disableHaptics && !loading && !rest.disabled) {
          haptics.light();
        }
        onClick?.(e);
      }}
      whileHover={prefersReducedMotion ? undefined : { scale: 1.05, boxShadow: glowShadow[variant] }}
      whileTap={prefersReducedMotion ? undefined : { scale: 0.95 }}
      className={cn(
        'relative overflow-hidden rounded-xl select-none transition-colors active-press neu-noise backdrop-blur-md shadow-neu-outset px-6 py-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed',
        gradientStyles[variant],
        compact && 'px-4 py-2',
        className
      )}
      {...(rest as any)}
    >
      {/* Inner glow */}
      <div className="absolute inset-0 bg-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      {/* Sheen */}
      <div className="pointer-events-none absolute -inset-[120%] bg-gradient-to-r from-transparent via-white/20 to-transparent rotate-12 group-hover:animate-sheen" />
      {/* Success particles */}
      {success && !loading && !prefersReducedMotion && (
        <div className="pointer-events-none absolute inset-0 animate-prism-success">
          {Array.from({ length: 14 }).map((_, i) => (
            <span
              key={i}
              className="absolute block w-1.5 h-1.5 rounded-full bg-current opacity-0 animate-prism-particle"
              style={{
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                animationDelay: `${i * 40}ms`,
              }}
            />
          ))}
        </div>
      )}
      {/* Content */}
      <div className="relative flex items-center gap-2 font-medium tracking-wide drop-shadow-[0_0_6px_currentColor]">
        {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : icon}
        <span>{children}</span>
      </div>
      {/* Dim overlay while loading */}
      {loading && <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px] rounded-xl" />}
    </motion.button>
  );
};

export default PrismButton;
