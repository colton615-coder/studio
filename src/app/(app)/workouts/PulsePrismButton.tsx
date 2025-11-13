"use client";
import React from "react";
import { Dumbbell } from "lucide-react";
import { PrismButton } from "@/components/ui/prism-button";

interface PulsePrismButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
  success?: boolean;
}

export const PulsePrismButton: React.FC<PulsePrismButtonProps> = ({
  loading,
  success,
  children,
  ...rest
}) => (
  <PrismButton
    variant="pulse"
    loading={loading}
    success={success}
    icon={<Dumbbell className="w-5 h-5" />}
    {...rest}
  >
    {children || 'New Workout'}
  </PrismButton>
);
