'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Loader2, CheckCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface AICoPilotThinkingProps {
  steps: string[];
  onComplete: () => void;
  durationPerStep?: number;
}

export function AICoPilotThinking({ steps, onComplete, durationPerStep = 2000 }: AICoPilotThinkingProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    if (currentStep >= steps.length) {
      // Add a small delay before calling onComplete to show the final checkmark
      const finalTimer = setTimeout(() => {
        onComplete();
      }, 500);
      return () => clearTimeout(finalTimer);
    }

    const timer = setTimeout(() => {
      setCurrentStep(prev => prev + 1);
    }, durationPerStep);

    return () => clearTimeout(timer);
  }, [currentStep, steps.length, onComplete, durationPerStep]);

  return (
    <Card className="shadow-neumorphic-outset w-full">
      <CardContent className="p-6">
        <div className="space-y-4">
          <AnimatePresence>
            {steps.slice(0, currentStep + 1).map((step, index) => {
               const isCurrent = index === currentStep;
               const isCompleted = index < currentStep;

              return (
                <motion.div
                  key={index}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: shouldReduceMotion ? 0 : 0.3 }}
                  className="flex items-center gap-3 text-sm"
                >
                  {isCompleted ? (
                     <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                  ) : (
                     <Loader2 className="h-4 w-4 animate-spin text-accent flex-shrink-0" />
                  )}
                  <span className={isCurrent ? "font-semibold text-foreground" : "text-muted-foreground"}>
                    {step}
                  </span>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </CardContent>
    </Card>
  );
}
