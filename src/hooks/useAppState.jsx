import { createContext, useContext, useCallback } from 'react';
import { useLocalStorage, defaultSettings, createEmptyDayLog } from './useLocalStorage';
import { getTodayISO } from '../utils/timeUtils';
import { generateNapId } from '../utils/scheduleAlgorithm';

const AppStateContext = createContext(null);

export function AppStateProvider({ children }) {
  const [settings, setSettings] = useLocalStorage('snap-settings', defaultSettings);
  const [days, setDays] = useLocalStorage('snap-days', {});

  // Get or create today's log
  const getTodayLog = useCallback(() => {
    const today = getTodayISO();
    return days[today] || createEmptyDayLog(today);
  }, [days]);

  // Get a specific day's log
  const getDayLog = useCallback(
    (date) => {
      return days[date] || createEmptyDayLog(date);
    },
    [days]
  );

  // Update today's wake time
  const setWakeTime = useCallback(
    (wakeTime) => {
      const today = getTodayISO();
      setDays((prev) => ({
        ...prev,
        [today]: {
          ...getDayLog(today),
          actualWakeTime: wakeTime,
        },
      }));
    },
    [getDayLog, setDays]
  );

  // Update today's bedtime
  const setBedtime = useCallback(
    (bedtime) => {
      const today = getTodayISO();
      setDays((prev) => ({
        ...prev,
        [today]: {
          ...getDayLog(today),
          actualBedtime: bedtime,
        },
      }));
    },
    [getDayLog, setDays]
  );

  // Add a new nap
  const addNap = useCallback(
    (startTime, endTime = null) => {
      const today = getTodayISO();
      const newNap = {
        id: generateNapId(),
        type: 'nap',
        startTime,
        endTime,
        notes: '',
      };

      setDays((prev) => {
        const dayLog = prev[today] || createEmptyDayLog(today);
        return {
          ...prev,
          [today]: {
            ...dayLog,
            sessions: [...dayLog.sessions, newNap],
          },
        };
      });

      return newNap.id;
    },
    [setDays]
  );

  // Update a nap
  const updateNap = useCallback(
    (napId, updates) => {
      const today = getTodayISO();
      setDays((prev) => {
        const dayLog = prev[today] || createEmptyDayLog(today);
        return {
          ...prev,
          [today]: {
            ...dayLog,
            sessions: dayLog.sessions.map((session) =>
              session.id === napId ? { ...session, ...updates } : session
            ),
          },
        };
      });
    },
    [setDays]
  );

  // Delete a nap
  const deleteNap = useCallback(
    (napId) => {
      const today = getTodayISO();
      setDays((prev) => {
        const dayLog = prev[today] || createEmptyDayLog(today);
        return {
          ...prev,
          [today]: {
            ...dayLog,
            sessions: dayLog.sessions.filter((session) => session.id !== napId),
          },
        };
      });
    },
    [setDays]
  );

  // Skip a predicted nap slot
  const skipNapSlot = useCallback(
    (slotIndex) => {
      const today = getTodayISO();
      setDays((prev) => {
        const dayLog = prev[today] || createEmptyDayLog(today);
        const skippedNapSlots = dayLog.skippedNapSlots || [];
        if (skippedNapSlots.includes(slotIndex)) return prev;
        return {
          ...prev,
          [today]: {
            ...dayLog,
            skippedNapSlots: [...skippedNapSlots, slotIndex],
          },
        };
      });
    },
    [setDays]
  );

  // Update settings
  const updateSettings = useCallback(
    (updates) => {
      setSettings((prev) => ({
        ...prev,
        ...updates,
      }));
    },
    [setSettings]
  );

  // Update schedule settings
  const updateScheduleSettings = useCallback(
    (updates) => {
      setSettings((prev) => ({
        ...prev,
        schedule: {
          ...prev.schedule,
          ...updates,
        },
      }));
    },
    [setSettings]
  );

  // Update baby info
  const updateBabyInfo = useCallback(
    (updates) => {
      setSettings((prev) => ({
        ...prev,
        baby: {
          ...prev.baby,
          ...updates,
        },
      }));
    },
    [setSettings]
  );

  // Complete onboarding
  const completeOnboarding = useCallback(() => {
    setSettings((prev) => ({
      ...prev,
      onboardingComplete: true,
    }));
  }, [setSettings]);

  // Get all days for history (last 30 days)
  const getHistoryDays = useCallback(() => {
    const result = [];
    const today = new Date();

    for (let i = 0; i < 30; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const dayLog = days[dateStr];

      if (dayLog && (dayLog.actualWakeTime || dayLog.sessions.length > 0)) {
        result.push(dayLog);
      }
    }

    return result;
  }, [days]);

  const value = {
    settings,
    days,
    getTodayLog,
    getDayLog,
    setWakeTime,
    setBedtime,
    addNap,
    updateNap,
    deleteNap,
    skipNapSlot,
    updateSettings,
    updateScheduleSettings,
    updateBabyInfo,
    completeOnboarding,
    getHistoryDays,
  };

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useAppState() {
  const context = useContext(AppStateContext);
  if (!context) {
    throw new Error('useAppState must be used within AppStateProvider');
  }
  return context;
}
