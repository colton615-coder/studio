"use client";

import React, { useEffect, useState } from "react";
import { MotionDiv } from "@/lib/motion";
import { Bot, Loader2 } from "lucide-react";
import affirmationsData from "@/data/affirmations.json";

export default function Splashscreen() {
  const [affirmation, setAffirmation] = useState<string>("");

  useEffect(() => {
    // Select a random affirmation from the imported data
    const random = affirmationsData[Math.floor(Math.random() * affirmationsData.length)];
    setAffirmation(random);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground">
      {/* Animated logo container */}
      <MotionDiv
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="flex flex-col items-center gap-4 mb-8"
      >
        <MotionDiv
          animate={{ 
            scale: [1, 1.05, 1],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/20 text-primary shadow-neumorphic-outset"
        >
          <Bot className="h-12 w-12 text-accent" />
        </MotionDiv>
        
        <MotionDiv
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          <h1 className="text-5xl font-bold font-headline text-accent">LiFE-iN-SYNC</h1>
        </MotionDiv>
      </MotionDiv>

      {/* Animated affirmation */}
      <MotionDiv
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.5 }}
        className="max-w-md text-center px-4"
      >
        <p className="text-lg font-medium text-muted-foreground mb-6">
          {affirmation || "Preparing your experience..."}
        </p>
      </MotionDiv>

      {/* Loading indicator */}
      <MotionDiv
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8, duration: 0.3 }}
        className="flex items-center gap-2"
      >
        <Loader2 className="h-5 w-5 animate-spin text-accent" />
        <span className="text-sm text-muted-foreground">Initializing...</span>
      </MotionDiv>
    </div>
  );
}
