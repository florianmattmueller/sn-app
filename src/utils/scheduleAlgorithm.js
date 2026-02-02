import { parseTime, addHours } from './timeUtils';

/**
 * Generate a day's schedule based on wake time and settings
 * Returns an array of events with their times and types
 */
export function generateDaySchedule(wakeTimeStr, settings, actualNaps = [], skippedNapSlots = []) {
  const events = [];
  const { defaultWakeWindow, defaultNapDuration, bedtime } = settings.schedule;

  const wakeTime = parseTime(wakeTimeStr);
  // Support both old bedtimeWindow format and new bedtime format for backwards compatibility
  const bedtimeStart = bedtime ? parseTime(bedtime) : parseTime(settings.schedule.bedtimeWindow?.start || '19:00');

  // Add wake up event
  events.push({
    id: 'wake',
    type: 'wake',
    time: wakeTime,
  });

  let currentTime = wakeTime;
  let napIndex = 0;

  // Merge actual naps with predictions
  const sortedActualNaps = [...actualNaps].sort(
    (a, b) => parseTime(a.startTime) - parseTime(b.startTime)
  );

  while (true) {
    // Check if there's an actual nap that should come next
    const nextActualNap = sortedActualNaps.find(
      (nap) => parseTime(nap.startTime) >= currentTime
    );

    // Calculate predicted nap start (after wake window)
    const predictedNapStart = addHours(currentTime, defaultWakeWindow);

    // If we have an actual nap and it's before or at the predicted time, use it
    if (nextActualNap && parseTime(nextActualNap.startTime) <= predictedNapStart + 30) {
      // Add awake window until actual nap
      const napStart = parseTime(nextActualNap.startTime);

      if (napStart > currentTime) {
        events.push({
          id: `awake-${napIndex}`,
          type: 'awake',
          start: currentTime,
          end: napStart,
        });
      }

      // Add actual nap
      const napEnd = nextActualNap.endTime
        ? parseTime(nextActualNap.endTime)
        : napStart + defaultNapDuration * 60;

      events.push({
        id: nextActualNap.id,
        type: 'nap',
        status: nextActualNap.endTime ? 'actual' : 'in-progress',
        start: napStart,
        end: napEnd,
        actualData: nextActualNap,
      });

      // Remove this nap from the list so we don't process it again
      const napIdx = sortedActualNaps.indexOf(nextActualNap);
      sortedActualNaps.splice(napIdx, 1);

      currentTime = napEnd;
      napIndex++;
      continue;
    }

    // Add predicted awake window
    if (predictedNapStart > currentTime) {
      events.push({
        id: `awake-${napIndex}`,
        type: 'awake',
        start: currentTime,
        end: predictedNapStart,
      });
    }

    // Calculate predicted nap end
    const predictedNapEnd = addHours(predictedNapStart, defaultNapDuration);

    // Don't add nap if there's not enough time for wake window before bedtime
    // Rule: napEnd + wakeWindow > bedtimeStart means no more naps
    const timeAfterNap = addHours(predictedNapEnd, defaultWakeWindow);
    if (timeAfterNap > bedtimeStart) {
      break;
    }

    // Add predicted nap window (unless skipped)
    if (!skippedNapSlots.includes(napIndex)) {
      events.push({
        id: `predicted-nap-${napIndex}`,
        type: 'nap',
        status: 'predicted',
        start: predictedNapStart,
        end: predictedNapEnd,
        slotIndex: napIndex,
      });
    }

    currentTime = predictedNapEnd;
    napIndex++;

    // Safety check - don't generate more than 10 naps
    if (napIndex > 10) break;
  }

  // Add final awake window until bedtime (if there's time)
  if (currentTime < bedtimeStart) {
    events.push({
      id: 'awake-final',
      type: 'awake',
      start: currentTime,
      end: bedtimeStart,
    });
  }

  // Add bedtime marker (single point in time, marks start of night sleep)
  events.push({
    id: 'bedtime',
    type: 'bedtime',
    start: bedtimeStart,
    end: bedtimeStart + 60, // Visual representation - 1 hour block for display
  });

  return events;
}

/**
 * Recalculate schedule starting from a specific point
 * Used when an actual nap time changes
 */
export function recalculateSchedule(wakeTimeStr, settings, actualNaps) {
  return generateDaySchedule(wakeTimeStr, settings, actualNaps);
}

/**
 * Check if a time falls within an event
 */
export function isTimeInEvent(timeMinutes, event) {
  if (event.time !== undefined) {
    // Point event (wake)
    return false;
  }
  return timeMinutes >= event.start && timeMinutes < event.end;
}

/**
 * Get the current event based on current time
 */
export function getCurrentEvent(events, currentTimeMinutes) {
  return events.find((event) => isTimeInEvent(currentTimeMinutes, event));
}

/**
 * Generate a unique ID for a new nap
 */
export function generateNapId() {
  return `nap-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
