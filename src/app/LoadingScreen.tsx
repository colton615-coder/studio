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
  } catch (error) {
    console.error('Error reading cached affirmation:', error);
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
  } catch (error) {
    console.error('Error caching affirmation:', error);
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
    console.error('Error fetching affirmation:', error);
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
      } catch (_error) {
        // Use fallback if fetch fails (offline, error, etc.)
        console.warn('Using fallback affirmation due to fetch error');
        setAffirmation(FALLBACK_AFFIRMATION);
        // Don't cache fallback - we want to try fetching again next time
      } finally {
        setIsLoading(false);
      }
    }

    loadAffirmation();
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background">
      {/* Animated gradient background overlay */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 via-blue-500/20 to-green-500/20 animate-gradient bg-[length:200%_200%]" />
      </div>

      <div className="relative z-10 flex flex-col items-center justify-center px-6 max-w-2xl">
        {/* Loading spinner container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <div className="relative w-24 h-24">
            {/* Outer spinning ring */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              className="absolute inset-0 rounded-full border-4 border-transparent border-t-accent border-r-accent/50 shadow-neumorphic-outset"
            />
            {/* Inner pulsing circle */}
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute inset-3 rounded-full bg-gradient-to-br from-accent/20 to-primary/20 shadow-neumorphic-inset"
            />
          </div>
        </motion.div>

        {/* Affirmation content */}
        {!isLoading && affirmation && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-center space-y-4"
          >
            {/* Affirmation text */}
            <motion.blockquote
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="text-xl md:text-2xl font-medium text-foreground leading-relaxed px-8 py-6 rounded-2xl bg-card/50 backdrop-blur-sm shadow-neumorphic-outset border border-border/50"
            >
              <span className="text-accent text-3xl leading-none">&ldquo;</span>
              {affirmation.text}
              <span className="text-accent text-3xl leading-none">&rdquo;</span>
            </motion.blockquote>

            {/* Source */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="text-sm md:text-base text-muted-foreground italic"
            >
              &mdash; {affirmation.source}
            </motion.p>
          </motion.div>
        )}

        {/* Loading text (shown only while loading) */}
        {isLoading && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="text-muted-foreground text-lg mt-4"
          >
            Loading your daily inspiration...
          </motion.p>
        )}

        {/* Subtle animated dots indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.8 }}
          className="flex space-x-2 mt-8"
        >
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                delay: i * 0.2,
                ease: 'easeInOut',
              }}
              className="w-2 h-2 rounded-full bg-accent"
            />
          ))}
        </motion.div>
      </div>
    </div>
  );
}
