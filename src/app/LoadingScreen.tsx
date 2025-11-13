'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { collection, getDocs } from 'firebase/firestore';
import { initializeFirebase } from '@/firebase';
import type { Affirmation, CachedAffirmation } from '@/types/affirmation';

const STORAGE_KEY = 'life-in-sync-daily-affirmation';

// Fallback affirmation for offline first-time loads
const FALLBACK_AFFIRMATION: Affirmation = {
  text: 'Every day is a new opportunity to grow, learn, and become the best version of yourself.',
  source: 'Default Inspiration',
};

/**
 * Check if a timestamp is from today
 */
function isSameDay(timestamp: string): boolean {
  const cached = new Date(timestamp);
  const today = new Date();
  return (
    cached.getDate() === today.getDate() &&
    cached.getMonth() === today.getMonth() &&
    cached.getFullYear() === today.getFullYear()
  );
}

/**
 * Get cached affirmation from localStorage
 */
function getCachedAffirmation(): Affirmation | null {
  if (typeof window === 'undefined') return null;

  try {
    const cached = localStorage.getItem(STORAGE_KEY);
    if (!cached) return null;

    const data: CachedAffirmation = JSON.parse(cached);
    
    // Check if the cached affirmation is from today
    if (isSameDay(data.timestamp)) {
      return data.affirmation;
    }
    
    return null;
  } catch {
    return null;
  }
}

/**
 * Save affirmation to localStorage with current timestamp
 */
function cacheAffirmation(affirmation: Affirmation): void {
  if (typeof window === 'undefined') return;

  try {
    const data: CachedAffirmation = {
      affirmation,
      timestamp: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // Cache write failure is non-critical
  }
}

/**
 * Fetch a random affirmation from Firestore
 */
async function fetchRandomAffirmation(): Promise<Affirmation> {
  try {
    const { firestore } = initializeFirebase();
    const affirmationsRef = collection(firestore, 'affirmations');
    
    // Get all documents and select a random one
    // For better performance with large collections, consider using a random field approach
    const snapshot = await getDocs(affirmationsRef);
    
    if (snapshot.empty) {
      throw new Error('No affirmations found in database');
    }
    
    // Pick a random document
    const docs = snapshot.docs;
    const randomDoc = docs[Math.floor(Math.random() * docs.length)];
    const data = randomDoc.data();
    
    return {
      id: randomDoc.id,
      text: data.text,
      source: data.source,
    };
  } catch (error) {
    throw error;
  }
}

/**
 * LoadingScreen Component
 * Displays a daily affirmation with neumorphic styling and animations
 */
export default function LoadingScreen() {
  const [affirmation, setAffirmation] = useState<Affirmation | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadAffirmation() {
      // First, check for cached affirmation
      const cached = getCachedAffirmation();
      
      if (cached) {
        setAffirmation(cached);
        setIsLoading(false);
        return;
      }

      // If no valid cache, fetch from Firestore
      try {
        const newAffirmation = await fetchRandomAffirmation();
        setAffirmation(newAffirmation);
        cacheAffirmation(newAffirmation);
      } catch {
        // Use fallback if fetch fails (offline, error, etc.)
        setAffirmation(FALLBACK_AFFIRMATION);
        // Don't cache fallback - we want to try fetching again next time
      } finally {
        setIsLoading(false);
      }
    }

    loadAffirmation();
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background overflow-hidden">
      {/* Animated gradient background overlay - more subtle */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-blue-500/10 to-green-500/10 animate-gradient bg-[length:200%_200%]" />
      </div>

      <div className="relative z-10 flex flex-col items-center justify-center px-8 sm:px-12 md:px-16 lg:px-20 max-w-5xl w-full min-h-screen py-20">
        {/* Loading spinner container - smaller and more elegant */}
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease: [0.34, 1.56, 0.64, 1] }}
          className="mb-16"
        >
          <div className="relative w-20 h-20">
            {/* Outer spinning ring - more refined */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2.5, repeat: Infinity, ease: 'linear' }}
              className="absolute inset-0 rounded-full border-[3px] border-transparent border-t-accent/80 border-r-accent/40"
            />
            {/* Inner pulsing circle - softer */}
            <motion.div
              animate={{ 
                scale: [1, 1.08, 1],
                opacity: [0.3, 0.5, 0.3]
              }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute inset-4 rounded-full bg-gradient-to-br from-accent/15 to-primary/15"
            />
          </div>
        </motion.div>

        {/* Affirmation content - enhanced layout and typography */}
        {!isLoading && affirmation && (
          <motion.div
            key={affirmation.id || affirmation.text}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ 
              duration: 0.8, 
              delay: 0.2,
              ease: [0.25, 0.1, 0.25, 1]
            }}
            className="text-center space-y-8 w-full"
          >
            {/* Affirmation text - larger, more elegant */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ 
                duration: 1, 
                delay: 0.4,
                ease: [0.25, 0.1, 0.25, 1]
              }}
              className="relative group"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-primary/5 rounded-3xl blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
              <blockquote className="relative text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-light text-foreground leading-[1.5] tracking-tight px-4 sm:px-8 md:px-12 py-8 md:py-10">
                <span className="text-accent/40 text-5xl sm:text-6xl md:text-7xl font-serif absolute -top-2 sm:-top-4 left-0 sm:left-4 select-none">&ldquo;</span>
                <span className="relative inline-block px-2 sm:px-4">
                  {affirmation.text}
                </span>
                <span className="text-accent/40 text-5xl sm:text-6xl md:text-7xl font-serif absolute -bottom-2 sm:-bottom-4 right-0 sm:right-4 select-none">&rdquo;</span>
              </blockquote>
            </motion.div>

            {/* Source - refined typography */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ 
                duration: 1, 
                delay: 0.8,
                ease: [0.25, 0.1, 0.25, 1]
              }}
              className="text-base sm:text-lg md:text-xl text-muted-foreground/80 italic font-light tracking-wide"
            >
              &mdash; {affirmation.source}
            </motion.p>

            {/* Tap to continue hint */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0.6, 0.6] }}
              transition={{ 
                duration: 2, 
                delay: 1.5,
                repeat: Infinity,
                repeatDelay: 1
              }}
              className="text-sm sm:text-base text-muted-foreground/60 font-light tracking-wider uppercase pt-8"
            >
              Tap to continue
            </motion.p>
          </motion.div>
        )}

        {/* Loading text - cleaner typography */}
        {isLoading && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.7, 0.7] }}
            transition={{ 
              duration: 1, 
              delay: 0.3,
              repeat: Infinity,
              repeatDelay: 0.5
            }}
            className="text-muted-foreground/70 text-lg sm:text-xl font-light tracking-wide mt-6"
          >
            Loading your daily inspiration...
          </motion.p>
        )}

        {/* Subtle animated dots indicator - more refined */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 1 }}
          className="flex space-x-3 mt-12 absolute bottom-16"
        >
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              animate={{
                scale: [1, 1.3, 1],
                opacity: [0.4, 0.8, 0.4],
              }}
              transition={{
                duration: 1.8,
                repeat: Infinity,
                delay: i * 0.3,
                ease: 'easeInOut',
              }}
              className="w-1.5 h-1.5 rounded-full bg-accent/60"
            />
          ))}
        </motion.div>
      </div>
    </div>
  );
}
