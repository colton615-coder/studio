"use client"

import { motion, HTMLMotionProps } from "framer-motion"
import React from "react"

// Use Framer Motion's HTMLMotionProps directly to avoid conflicts with React's
// DOM event typings (onDrag, etc.). This keeps the motion props accurate.
export type MotionDivProps = any

export const MotionDiv: any = motion.div

export type MotionButtonProps = any
export const MotionButton: any = motion.button

export const MotionSlot = motion as any
