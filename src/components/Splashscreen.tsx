"use client";

import React, { useEffect, useState } from "react";
import { MotionDiv } from "@/lib/motion";
import affirmationsData from "@/data/affirmations.json";

/**
 * Splashscreen with animated daily affirmation
 * - Affirmation animates from small to big
 * - Shows while app loads in background
 * - Fades away to reveal the dashboard
 */
export default function Splashscreen() {
  const [affirmation, setAffirmation] = useState<string>("");

  useEffect(() => {
    // Select a random affirmation from the imported data
    const random = affirmationsData[Math.floor(Math.random() * affirmationsData.length)];
    setAffirmation(random);
  }, []);

  return (
    <MotionDiv
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-br from-background via-background to-primary/5"
    >
      {/* Main affirmation - animates from small to big */}
      <MotionDiv
        initial={{ scale: 0.3, opacity: 0 }}
        animate={{ 
          scale: [0.3, 1.1, 1],
          opacity: [0, 1, 1]
        }}
        transition={{ 
          duration: 1.2,
          ease: [0.34, 1.56, 0.64, 1], // Bouncy easing
          times: [0, 0.7, 1]
        }}
        className="max-w-2xl px-8 text-center"
      >
        {/* Affirmation text with glow effect */}
        <MotionDiv
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.8 }}
          className="relative"
        >
          <p className="text-2xl sm:text-3xl md:text-4xl font-bold font-headline text-accent leading-relaxed">
            {affirmation || "Every day is a new opportunity to grow..."}
          </p>
          
          {/* Decorative quotation marks */}
          <span className="absolute -top-4 -left-2 text-6xl text-accent/30 font-serif">&ldquo;</span>
          <span className="absolute -bottom-4 -right-2 text-6xl text-accent/30 font-serif">&rdquo;</span>
        </MotionDiv>
      </MotionDiv>

      {/* Subtle pulsing dots indicator */}
      <MotionDiv
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 0.5 }}
        className="flex space-x-2 mt-12"
      >
        {[0, 1, 2].map((i) => (
          <MotionDiv
            key={i}
            animate={{
              scale: [1, 1.5, 1],
              opacity: [0.5, 1, 0.5],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              delay: i * 0.2,
              ease: "easeInOut",
            }}
            className="w-2 h-2 rounded-full bg-accent"
          />
        ))}
      </MotionDiv>
    </MotionDiv>
  );
}
