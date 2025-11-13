"use client";
import React from "react";
import { Flame } from "lucide-react";
import { PrismButton } from "@/components/ui/prism-button";

interface EmberPrismButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
  success?: boolean;
}

export const EmberPrismButton: React.FC<EmberPrismButtonProps> = ({
  loading,
  success,
  children,
  ...rest
}) => (
  <PrismButton
    variant="ember"
    loading={loading}
    success={success}
    icon={<Flame className="w-5 h-5" />}
    {...rest}
  >
    {children || 'Log Habit'}
  </PrismButton>
);
