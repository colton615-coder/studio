"use client";
import React from "react";
import { Plus } from "lucide-react";
import { PrismButton } from "@/components/ui/prism-button";

interface EmeraldPrismButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
  success?: boolean;
}

export const EmeraldPrismButton: React.FC<EmeraldPrismButtonProps> = ({
  loading,
  success,
  children,
  onClick,
  ...rest
}) => (
  <PrismButton
    variant="emerald"
    loading={loading}
    success={success}
    icon={<Plus className="w-5 h-5" />}
    onClick={onClick}
    {...rest}
  >
    {children || 'New Budget'}
  </PrismButton>
);

// Keyframe for sheen animation (inject via style tag or global css if desired)
// Using inline <style> injection is avoided here; assumed global.css can be extended.
