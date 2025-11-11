'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from './button';
import { Pause, Play, SkipForward } from 'lucide-react';

interface RestTimerProps {
  duration: number; // Duration in seconds
  onComplete: () => void;
  onSkip: () => void;
}

export function RestTimer({ duration, onComplete, onSkip }: RestTimerProps) {
  const [timeLeft, setTimeLeft] = useState(duration);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    setTimeLeft(duration);
    setIsPaused(false);
  }, [duration]);

  useEffect(() => {
    if (isPaused || timeLeft <= 0) return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          onComplete();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [timeLeft, isPaused, onComplete]);

  const progress = (timeLeft / duration) * 100;
  const radius = 90;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className="flex flex-col items-center justify-center gap-8 py-8">
      <div className="relative">
        {/* SVG Progress Ring */}
        <svg width="240" height="240" className="transform -rotate-90">
          {/* Background Circle */}
          <circle
            cx="120"
            cy="120"
            r={radius}
            fill="none"
            stroke="hsl(var(--muted))"
            strokeWidth="12"
            opacity="0.3"
          />
          {/* Progress Circle */}
          <motion.circle
            cx="120"
            cy="120"
            r={radius}
            fill="none"
            stroke="hsl(var(--primary))"
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            initial={{ strokeDashoffset: 0 }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 0.5, ease: 'easeInOut' }}
            style={{
              filter: 'drop-shadow(0 0 8px hsl(var(--primary) / 0.5))',
            }}
          />
        </svg>

        {/* Time Display */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-6xl font-bold font-mono">{timeLeft}</span>
          <span className="text-sm text-muted-foreground">seconds</span>
        </div>
      </div>

      <div className="flex gap-4">
        <Button
          onClick={() => setIsPaused(!isPaused)}
          variant="outline"
          size="lg"
          className="shadow-neumorphic-outset active:shadow-neumorphic-inset"
        >
          {isPaused ? <Play className="h-5 w-5" /> : <Pause className="h-5 w-5" />}
          <span className="ml-2">{isPaused ? 'Resume' : 'Pause'}</span>
        </Button>
        <Button
          onClick={onSkip}
          variant="outline"
          size="lg"
          className="shadow-neumorphic-outset active:shadow-neumorphic-inset"
        >
          <SkipForward className="h-5 w-5" />
          <span className="ml-2">Skip Rest</span>
        </Button>
      </div>

      <div className="text-center">
        <p className="text-xl font-semibold text-primary">Rest Time</p>
        <p className="text-sm text-muted-foreground">
          Take a breather before your next exercise
        </p>
      </div>
    </div>
  );
}
