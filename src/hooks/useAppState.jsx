import { createContext, useContext, useCallback, useMemo } from 'react';
import { useSupabaseSync } from './useSupabaseSync';
import { getTodayISO } from '../utils/timeUtils';
import { defaultSettings, createEmptyDayLog } from './useLocalStorage';

const AppStateContext = createContext(null);

export function AppStateProvider({ children }) {
  const {
    household,
    settings: supabaseSettings,
    days: supabaseDays,
    loading,
    syncing,
    createHousehold,
    updateHouseholdSettings,
    setWakeTime: supabaseSetWakeTime,
    addNap: supabaseAddNap,
    updateNap: supabaseUpdateNap,
    deleteNap: supabaseDeleteNap,
    skipNapSlot: supabaseSkipNapSlot,
  } = useSupabaseSync();

  // Use Supabase settings or defaults
  const settings = useMemo(() => {
    if (supabaseSettings) return supabaseSettings;
    if (household === null && !loading) {
      // No household yet - return defaults with onboarding incomplete
      return { ...defaultSettings, onboardingComplete: false };
    }
    return defaultSettings;
  }, [supabaseSettings, household, loading]);

  // Get a specific day's log
  const getDayLog = useCallback(
    (date) => {
      return supabaseDays[date] || createEmptyDayLog(date);
    },
    [supabaseDays]
  );

  // Get today's log
  const getTodayLog = useCallback(() => {
    const today = getTodayISO();
    return getDayLog(today);
  }, [getDayLog]);

  // Set wake time
  const setWakeTime = useCallback(
    (wakeTime) => {
      supabaseSetWakeTime(wakeTime);
    },
    [supabaseSetWakeTime]
  );

  // Set bedtime (updates household settings)
  const setBedtime = useCallback(
    (bedtime) => {
      updateHouseholdSettings({ schedule: { bedtime } });
    },
    [updateHouseholdSettings]
  );

  // Add a new nap
  const addNap = useCallback(
    (startTime, endTime = null) => {
      return supabaseAddNap(startTime, endTime);
    },
    [supabaseAddNap]
  );

  // Update a nap
  const updateNap = useCallback(
    (napId, updates) => {
      supabaseUpdateNap(napId, updates);
    },
    [supabaseUpdateNap]
  );

  // Delete a nap
  const deleteNap = useCallback(
    (napId) => {
      supabaseDeleteNap(napId);
    },
    [supabaseDeleteNap]
  );

  // Skip a predicted nap slot
  const skipNapSlot = useCallback(
    (slotIndex) => {
      supabaseSkipNapSlot(slotIndex);
    },
    [supabaseSkipNapSlot]
  );

  // Update schedule settings
  const updateScheduleSettings = useCallback(
    (updates) => {
      updateHouseholdSettings({ schedule: updates });
    },
    [updateHouseholdSettings]
  );

  // Update baby info
  const updateBabyInfo = useCallback(
    (updates) => {
      updateHouseholdSettings({ baby: updates });
    },
    [updateHouseholdSettings]
  );

  // Complete onboarding (creates household)
  const completeOnboarding = useCallback(
    async (babyInfo, scheduleSettings) => {
      await createHousehold(babyInfo, scheduleSettings);
    },
    [createHousehold]
  );

  // Get history days
  const getHistoryDays = useCallback(() => {
    const result = [];
    const today = new Date();

    for (let i = 0; i < 30; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const dayLog = supabaseDays[dateStr];

      if (dayLog && (dayLog.actualWakeTime || dayLog.sessions?.length > 0)) {
        result.push(dayLog);
      }
    }

    return result;
  }, [supabaseDays]);

  const value = {
    settings,
    days: supabaseDays,
    loading,
    syncing,
    getTodayLog,
    getDayLog,
    setWakeTime,
    setBedtime,
    addNap,
    updateNap,
    deleteNap,
    skipNapSlot,
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
