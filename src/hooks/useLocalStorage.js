import { useState, useEffect } from 'react';

/**
 * Hook for persisting state to localStorage
 */
export function useLocalStorage(key, initialValue) {
  // Get initial value from localStorage or use provided initial value
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  // Update localStorage when state changes
  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(storedValue));
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  }, [key, storedValue]);

  return [storedValue, setStoredValue];
}

/**
 * Default settings for a new user
 */
export const defaultSettings = {
  baby: {
    name: null,
    birthday: null,
  },
  schedule: {
    defaultWakeWindow: 1.5,
    defaultNapDuration: 0.5,
    typicalWakeTime: '06:30',
    bedtime: '19:00', // Single time - marks start of night sleep
  },
  onboardingComplete: false,
};

/**
 * Default empty day log
 */
export function createEmptyDayLog(date) {
  return {
    date,
    actualWakeTime: null,
    actualBedtime: null,
    sessions: [],
    skippedNapSlots: [], // Array of nap slot indices (0, 1, 2, etc.) that user has skipped
  };
}
