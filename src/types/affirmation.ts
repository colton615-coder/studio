/**
 * Type definition for daily affirmations displayed on the loading screen
 */

export interface Affirmation {
  id?: string;
  text: string;
  source: string;
}

/**
 * Type for cached affirmation data in localStorage
 */
export interface CachedAffirmation {
  affirmation: Affirmation;
  timestamp: string;
}
