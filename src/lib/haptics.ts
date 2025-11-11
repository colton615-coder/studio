/**
 * iOS Haptic Feedback API wrapper
 * Provides vibration patterns for important user interactions
 */

export const haptics = {
  /**
   * Light haptic pulse (50ms)
   * Use for subtle interactions like button presses
   */
  light: () => {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(50);
    }
  },

  /**
   * Medium haptic pulse (pulse pattern)
   * Use for task completion, habit tracking
   */
  medium: () => {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate([50, 50, 50]);
    }
  },

  /**
   * Strong haptic pulse (200ms)
   * Use for significant achievements, workout completion
   */
  strong: () => {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(200);
    }
  },

  /**
   * Custom haptic pattern
   * @param pattern Array of vibration durations in milliseconds
   * Example: [100, 75, 100, 75] creates a double pulse
   */
  pattern: (pattern: number[]) => {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(pattern);
    }
  },

  /**
   * Success pattern (celebratory)
   * Use for streak milestones, personal records
   */
  success: () => {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate([100, 75, 100, 75]);
    }
  },

  /**
   * Error pattern
   * Use for failed operations or warnings
   */
  error: () => {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate([200, 100, 200]);
    }
  },
};
