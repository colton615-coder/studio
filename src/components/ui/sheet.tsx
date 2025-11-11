"use client"

import * as React from "react"
import * as SheetPrimitive from "@radix-ui/react-dialog"
import { cva, type VariantProps } from "class-variance-authority"
import { X } from "lucide-react"
import { motion, AnimatePresence, useReducedMotion } from "framer-motion"

import { cn } from "@/lib/utils"

const Sheet = SheetPrimitive.Root

const SheetTrigger = SheetPrimitive.Trigger

const SheetClose = SheetPrimitive.Close

const SheetPortal = SheetPrimitive.Portal

const SheetOverlay = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <SheetPrimitive.Overlay
    className={cn(
      "fixed inset-0 z-50 bg-black/80 backdrop-blur-sm",
      className
    )}
    {...props}
    ref={ref}
  />
))
SheetOverlay.displayName = SheetPrimitive.Overlay.displayName

const sheetVariants = cva(
  "fixed z-50 gap-4 bg-background p-6 shadow-lg",
  {
    variants: {
      side: {
        top: "inset-x-0 top-0 border-b pt-[max(24px,env(safe-area-inset-top))]",
        bottom: "inset-x-0 bottom-0 border-t pb-[max(24px,env(safe-area-inset-bottom))]",
        left: "inset-y-0 left-0 h-full w-3/4 border-r sm:max-w-sm pl-[max(24px,env(safe-area-inset-left))]",
        right: "inset-y-0 right-0 h-full w-3/4 border-l sm:max-w-sm pr-[max(24px,env(safe-area-inset-right))]",
      },
    },
    defaultVariants: {
      side: "right",
    },
  }
)

interface SheetContentProps
  extends React.ComponentPropsWithoutRef<typeof SheetPrimitive.Content>,
    VariantProps<typeof sheetVariants> {
  open?: boolean
}

const SheetContent = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Content>,
  SheetContentProps
>(({ side = "right", className, children, open, ...props }, ref) => {
  const shouldReduceMotion = useReducedMotion()
  const variants = {
    top: { y: "-100%", x: 0 },
    bottom: { y: "100%", x: 0 },
    left: { x: "-100%", y: 0 },
    right: { x: "100%", y: 0 },
  }
  return (
    <SheetPortal>
       <AnimatePresence>
         {open && (
            <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
            >
              <SheetOverlay />
            </motion.div>
            <SheetPrimitive.Content ref={ref} asChild {...props}>
              {(() => {
                const key = (side ?? 'right') as 'top' | 'bottom' | 'left' | 'right'
                const start = variants[key]
                return (
                  <motion.div
                    initial={start}
                    animate={{ x: 0, y: 0 }}
                    exit={start}
                    transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.4, ease: [0.36, 0.66, 0.04, 1] }}
                    className={cn(sheetVariants({ side }), className)}
                  >
                    {children}
                    <SheetPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-secondary">
                      <X className="h-4 w-4" />
                      <span className="sr-only">Close</span>
                    </SheetPrimitive.Close>
                  </motion.div>
                )
              })()}
              
            </SheetPrimitive.Content>
            </>
         )}
        </AnimatePresence>
    </SheetPortal>
  )
})
SheetContent.displayName = SheetPrimitive.Content.displayName


const SheetHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col space-y-2 text-center sm:text-left",
      className
    )}
    {...props}
  />
)
SheetHeader.displayName = "SheetHeader"

const SheetFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2",
      className
    )}
    {...props}
  />
)
SheetFooter.displayName = "SheetFooter"

const SheetTitle = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Title>
>(({ className, ...props }, ref) => (
  <SheetPrimitive.Title
    ref={ref}
    className={cn("text-lg font-semibold text-foreground", className)}
    {...props}
  />
))
SheetTitle.displayName = SheetPrimitive.Title.displayName

const SheetDescription = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Description>
>(({ className, ...props }, ref) => (
  <SheetPrimitive.Description
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
SheetDescription.displayName = SheetPrimitive.Description.displayName

export {
  Sheet,
  SheetPortal,
  SheetOverlay,
  SheetTrigger,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription,
}
