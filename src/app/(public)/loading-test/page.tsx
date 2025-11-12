'use client';

import { useState, useEffect } from 'react';
import LoadingScreen from '@/app/LoadingScreen';

/**
 * Public test page for LoadingScreen component (no auth required)
 */
export default function LoadingTestPage() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Show loading screen for 4 seconds to allow time to see it
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 4000);

    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-8">
      <div className="max-w-2xl space-y-6">
        <h1 className="text-4xl font-bold text-center">Loading Complete! ✓</h1>
        <p className="text-center text-muted-foreground">
          The loading screen successfully displayed a daily affirmation.
        </p>
        <div className="text-center">
          <button
            onClick={() => setIsLoading(true)}
            className="px-6 py-3 bg-accent text-accent-foreground rounded-lg shadow-neumorphic-outset hover:shadow-neumorphic-purple transition-shadow"
          >
            Show Again
          </button>
        </div>
      </div>
    </div>
  );
}
