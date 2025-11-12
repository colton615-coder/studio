'use client';

import { useState, useEffect } from 'react';
import LoadingScreen from '@/app/LoadingScreen';

/**
 * Demo page showing LoadingScreen component usage
 * This demonstrates the loading screen with daily affirmations
 */
export default function LoadingDemoPage() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate initial app load - show loading screen for 3 seconds
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  // Show loading screen while loading
  if (isLoading) {
    return <LoadingScreen />;
  }

  // Main content after loading
  return (
    <div className="container mx-auto p-8 space-y-6">
      <h1 className="text-4xl font-bold text-foreground">Loading Screen Demo</h1>
      
      <div className="space-y-4">
        <p className="text-lg text-muted-foreground">
          The loading screen has finished! It displayed a daily affirmation.
        </p>

        <div className="p-6 rounded-lg bg-card shadow-neumorphic-outset border border-border space-y-4">
          <h2 className="text-2xl font-semibold">How it works:</h2>
          <ul className="space-y-2 list-disc list-inside text-muted-foreground">
            <li>On first load, it fetches a random affirmation from Firestore</li>
            <li>The affirmation is cached in localStorage for the entire day</li>
            <li>If you reload the page today, you&apos;ll see the same affirmation</li>
            <li>Tomorrow, a new affirmation will be fetched</li>
            <li>If offline on first load, a fallback affirmation is shown</li>
          </ul>

          <div className="pt-4">
            <button
              onClick={() => setIsLoading(true)}
              className="px-6 py-3 bg-accent text-accent-foreground rounded-lg shadow-neumorphic-outset hover:shadow-neumorphic-purple transition-shadow"
            >
              Show Loading Screen Again
            </button>
          </div>
        </div>

        <div className="p-6 rounded-lg bg-card/50 border border-border space-y-2">
          <h3 className="text-xl font-semibold">Testing Tips:</h3>
          <ol className="space-y-1 list-decimal list-inside text-sm text-muted-foreground">
            <li>Open DevTools Console to see cache behavior</li>
            <li>Clear localStorage to see a new affirmation: <code className="text-xs bg-muted px-2 py-1 rounded">localStorage.removeItem(&apos;life-in-sync-daily-affirmation&apos;)</code></li>
            <li>Go offline (DevTools &gt; Network &gt; Offline) to test fallback</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
