/* eslint-disable no-console */

/**
 * Dev-only logging helpers to avoid accidental console statements in production builds.
 */
export const logError = (...args: unknown[]) => {
  if (process.env.NODE_ENV !== 'production') {
    console.error(...args);
  }
};

export const logWarn = (...args: unknown[]) => {
  if (process.env.NODE_ENV !== 'production') {
    console.warn(...args);
  }
};

export const logInfo = (...args: unknown[]) => {
  if (process.env.NODE_ENV !== 'production') {
    console.info(...args);
  }
};

export const logDebug = (...args: unknown[]) => {
  if (process.env.NODE_ENV !== 'production') {
    console.debug(...args);
  }
};

/* eslint-enable no-console */
