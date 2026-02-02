import { useState, useEffect } from 'react';
import { getCurrentTimeMinutes } from '../utils/timeUtils';

/**
 * Hook that returns current time in minutes and updates every minute
 */
export function useCurrentTime() {
  const [currentTime, setCurrentTime] = useState(getCurrentTimeMinutes);

  useEffect(() => {
    // Update immediately to sync with the current minute
    const now = new Date();
    const msUntilNextMinute = (60 - now.getSeconds()) * 1000 - now.getMilliseconds();

    // First update at the start of the next minute
    const initialTimeout = setTimeout(() => {
      setCurrentTime(getCurrentTimeMinutes());

      // Then update every minute
      const interval = setInterval(() => {
        setCurrentTime(getCurrentTimeMinutes());
      }, 60000);

      return () => clearInterval(interval);
    }, msUntilNextMinute);

    return () => clearTimeout(initialTimeout);
  }, []);

  return currentTime;
}
