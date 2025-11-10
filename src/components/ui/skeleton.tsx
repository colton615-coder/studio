"use client"

import { cn } from "@/lib/utils"
import { motion, useReducedMotion } from "framer-motion"
const MotionDiv: any = motion.div

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  shimmer?: boolean
}

function Skeleton({
  className,
  shimmer = true,
  ...props
}: SkeletonProps) {
  const shouldReduce = useReducedMotion()
  return (
    <MotionDiv
      initial={{ opacity: 0.5 }}
      animate={shouldReduce ? undefined : { opacity: [0.5, 0.8, 0.5] }}
      transition={shouldReduce ? undefined : { duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
      className={cn(
        "rounded-md bg-muted",
        shimmer && "relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-shimmer before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent",
        className
      )}
      {...props}
    />
  )
}

export { Skeleton }
