import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';
import { getTodayISO } from '../utils/timeUtils';

export function useSupabaseSync() {
  const { user } = useAuth();
  const [household, setHousehold] = useState(null);
  const [settings, setSettings] = useState(null);
  const [days, setDays] = useState({});
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const initializedRef = useRef(false);
  const householdRef = useRef(null);

  // Keep ref in sync with state
  useEffect(() => {
    householdRef.current = household;
  }, [household]);

  // Create new household for user
  const createHousehold = useCallback(async (babyInfo, scheduleSettings) => {
    if (!user || !supabase) return null;

    // Create household
    const { data: newHousehold, error: householdError } = await supabase
      .from('households')
      .insert({
        baby_name: babyInfo.name,
        baby_birthday: babyInfo.birthday,
        default_wake_window: scheduleSettings.defaultWakeWindow,
        default_nap_duration: scheduleSettings.defaultNapDuration,
        typical_wake_time: scheduleSettings.typicalWakeTime,
        bedtime: scheduleSettings.bedtime,
      })
      .select()
      .single();

    if (householdError) {
      console.error('Error creating household:', householdError);
      return null;
    }

    // Add user as member
    await supabase
      .from('household_members')
      .insert({
        household_id: newHousehold.id,
        user_id: user.id,
      });

    setHousehold(newHousehold);
    householdRef.current = newHousehold;
    return newHousehold;
  }, [user]);

  // Update household settings
  const updateHouseholdSettings = useCallback(async (updates) => {
    const h = householdRef.current;
    if (!h || !supabase) return;

    setSyncing(true);
    const { data, error } = await supabase
      .from('households')
      .update({
        baby_name: updates.baby?.name ?? h.baby_name,
        baby_birthday: updates.baby?.birthday ?? h.baby_birthday,
        default_wake_window: updates.schedule?.defaultWakeWindow ?? h.default_wake_window,
        default_nap_duration: updates.schedule?.defaultNapDuration ?? h.default_nap_duration,
        typical_wake_time: updates.schedule?.typicalWakeTime ?? h.typical_wake_time,
        bedtime: updates.schedule?.bedtime ?? h.bedtime,
      })
      .eq('id', h.id)
      .select()
      .single();

    if (!error && data) {
      setHousehold(data);
      householdRef.current = data;
    }
    setSyncing(false);
  }, []);

  // Get or create day record
  const getOrCreateDay = useCallback(async (date) => {
    const h = householdRef.current;
    if (!h || !supabase) return null;

    // Check if day exists
    let { data: existingDay } = await supabase
      .from('days')
      .select('id')
      .eq('household_id', h.id)
      .eq('date', date)
      .single();

    if (existingDay) return existingDay.id;

    // Create new day
    const { data: newDay } = await supabase
      .from('days')
      .insert({
        household_id: h.id,
        date,
      })
      .select('id')
      .single();

    return newDay?.id;
  }, []);

  // Set wake time
  const setWakeTime = useCallback(async (wakeTime) => {
    const today = getTodayISO();
    const dayId = await getOrCreateDay(today);
    if (!dayId || !supabase) return;

    setSyncing(true);
    await supabase
      .from('days')
      .update({ actual_wake_time: wakeTime })
      .eq('id', dayId);

    setDays(prev => ({
      ...prev,
      [today]: {
        ...prev[today],
        date: today,
        actualWakeTime: wakeTime,
        sessions: prev[today]?.sessions || [],
        skippedNapSlots: prev[today]?.skippedNapSlots || [],
        _dbId: dayId,
      },
    }));
    setSyncing(false);
  }, [getOrCreateDay]);

  // Add nap
  const addNap = useCallback(async (startTime, endTime) => {
    const today = getTodayISO();
    const dayId = await getOrCreateDay(today);
    if (!dayId || !supabase) return null;

    setSyncing(true);
    const { data: newNap } = await supabase
      .from('naps')
      .insert({
        day_id: dayId,
        start_time: startTime,
        end_time: endTime,
      })
      .select()
      .single();

    if (newNap) {
      const napObj = {
        id: newNap.id,
        type: 'nap',
        startTime: newNap.start_time,
        endTime: newNap.end_time,
        notes: '',
      };

      setDays(prev => ({
        ...prev,
        [today]: {
          ...prev[today],
          date: today,
          sessions: [...(prev[today]?.sessions || []), napObj],
          skippedNapSlots: prev[today]?.skippedNapSlots || [],
          _dbId: dayId,
        },
      }));
    }
    setSyncing(false);
    return newNap?.id;
  }, [getOrCreateDay]);

  // Update nap
  const updateNap = useCallback(async (napId, updates) => {
    if (!supabase) return;

    setSyncing(true);
    await supabase
      .from('naps')
      .update({
        start_time: updates.startTime,
        end_time: updates.endTime,
      })
      .eq('id', napId);

    setDays(prev => {
      const newDays = { ...prev };
      for (const date of Object.keys(newDays)) {
        const day = newDays[date];
        if (day.sessions) {
          newDays[date] = {
            ...day,
            sessions: day.sessions.map(s =>
              s.id === napId ? { ...s, ...updates } : s
            ),
          };
        }
      }
      return newDays;
    });
    setSyncing(false);
  }, []);

  // Delete nap
  const deleteNap = useCallback(async (napId) => {
    if (!supabase) return;

    setSyncing(true);
    await supabase
      .from('naps')
      .delete()
      .eq('id', napId);

    setDays(prev => {
      const newDays = { ...prev };
      for (const date of Object.keys(newDays)) {
        const day = newDays[date];
        if (day.sessions) {
          newDays[date] = {
            ...day,
            sessions: day.sessions.filter(s => s.id !== napId),
          };
        }
      }
      return newDays;
    });
    setSyncing(false);
  }, []);

  // Skip nap slot
  const skipNapSlot = useCallback(async (slotIndex) => {
    const today = getTodayISO();
    const dayId = await getOrCreateDay(today);
    if (!dayId || !supabase) return;

    setDays(prev => {
      const currentSkipped = prev[today]?.skippedNapSlots || [];
      if (currentSkipped.includes(slotIndex)) return prev;

      const newSkipped = [...currentSkipped, slotIndex];

      // Update in background
      supabase
        .from('days')
        .update({ skipped_nap_slots: newSkipped })
        .eq('id', dayId)
        .then();

      return {
        ...prev,
        [today]: {
          ...prev[today],
          date: today,
          skippedNapSlots: newSkipped,
          sessions: prev[today]?.sessions || [],
          _dbId: dayId,
        },
      };
    });
  }, [getOrCreateDay]);

  // Convert household to settings format
  useEffect(() => {
    if (household) {
      setSettings({
        baby: {
          name: household.baby_name,
          birthday: household.baby_birthday,
        },
        schedule: {
          defaultWakeWindow: parseFloat(household.default_wake_window) || 1.5,
          defaultNapDuration: parseFloat(household.default_nap_duration) || 0.5,
          typicalWakeTime: household.typical_wake_time || '06:30',
          bedtime: household.bedtime || '19:00',
        },
        onboardingComplete: true,
      });
    }
  }, [household]);

  // Initial load - only runs once per user
  useEffect(() => {
    if (!user) {
      setLoading(false);
      initializedRef.current = false;
      return;
    }

    if (initializedRef.current) return;
    initializedRef.current = true;

    async function init() {
      if (!supabase) {
        setLoading(false);
        return;
      }

      setLoading(true);

      // Load household
      const { data: membership } = await supabase
        .from('household_members')
        .select('household_id')
        .eq('user_id', user.id)
        .single();

      if (membership) {
        const { data: householdData } = await supabase
          .from('households')
          .select('*')
          .eq('id', membership.household_id)
          .single();

        if (householdData) {
          setHousehold(householdData);
          householdRef.current = householdData;

          // Load days
          const { data: daysData } = await supabase
            .from('days')
            .select(`*, naps (*)`)
            .eq('household_id', householdData.id)
            .order('date', { ascending: false })
            .limit(30);

          if (daysData) {
            const daysMap = {};
            for (const day of daysData) {
              daysMap[day.date] = {
                date: day.date,
                actualWakeTime: day.actual_wake_time,
                actualBedtime: day.actual_bedtime,
                skippedNapSlots: day.skipped_nap_slots || [],
                sessions: day.naps.map(nap => ({
                  id: nap.id,
                  type: 'nap',
                  startTime: nap.start_time,
                  endTime: nap.end_time,
                  notes: nap.notes || '',
                })),
                _dbId: day.id,
              };
            }
            setDays(daysMap);
          }
        }
      }

      setLoading(false);
    }

    init();
  }, [user]);

  return {
    household,
    settings,
    days,
    loading,
    syncing,
    createHousehold,
    updateHouseholdSettings,
    setWakeTime,
    addNap,
    updateNap,
    deleteNap,
    skipNapSlot,
  };
}
