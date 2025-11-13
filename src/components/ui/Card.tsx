import * as React from "react";
import { twMerge } from "tailwind-merge";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={twMerge(
        "bg-background-secondary rounded-lg shadow-neumorphic-outset p-4",
        className
      )}
      {...props}
    />
  )
);

Card.displayName = "Card";
