import { useMemo, useCallback, useRef, useEffect } from 'react';
import { useAppState } from '../hooks/useAppState';
import { useCurrentTime } from '../hooks/useCurrentTime';
import { generateDaySchedule } from '../utils/scheduleAlgorithm';
import { formatDateDisplay, isToday, parseTime, formatTime24 } from '../utils/timeUtils';
import TimelineEvent from './TimelineEvent';
import CurrentTimeIndicator from './CurrentTimeIndicator';
import './Timeline.css';

// ~0.7px per minute = full 24h (1440 minutes) fits in ~1008px
const PIXELS_PER_MINUTE = 0.7;

// Simple sun icon for wake time
const SunIcon = () => (
  <svg className="time-icon" viewBox="0 0 20 20" fill="currentColor">
    <circle cx="10" cy="10" r="4" />
    <path d="M10 2v3M10 15v3M18 10h-3M5 10H2M15.5 4.5l-2 2M6.5 13.5l-2 2M15.5 15.5l-2-2M6.5 6.5l-2-2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none" />
  </svg>
);

// Crescent moon with stars for bedtime
const MoonIcon = () => (
  <svg className="time-icon" viewBox="0 0 20 20" fill="currentColor">
    <path d="M7 2a7 7 0 0 0 0 14 7 7 0 0 0 7-7 5.5 5.5 0 0 1-7-7z" />
    <circle cx="15" cy="4" r="1.2" />
    <circle cx="17" cy="8" r="0.8" />
  </svg>
);

export default function Timeline({ date, onEditWakeTime, onEditBedtime, onEditNap, onAddNap }) {
  const { settings, getDayLog, updateNap, skipNapSlot } = useAppState();
  const currentTime = useCurrentTime();
  const dayLog = getDayLog(date);
  const scrollRef = useRef(null);

  const isCurrentDay = isToday(date);

  // Get wake time (actual or typical)
  const wakeTime = dayLog.actualWakeTime || settings.schedule.typicalWakeTime;

  // Get bedtime (support both old format and new format)
  const bedtime = settings.schedule.bedtime || settings.schedule.bedtimeWindow?.start || '19:00';

  // Get skipped nap slots
  const skippedNapSlots = dayLog.skippedNapSlots || [];

  // Generate the schedule
  const events = useMemo(() => {
    return generateDaySchedule(wakeTime, settings, dayLog.sessions, skippedNapSlots);
  }, [wakeTime, settings, dayLog.sessions, skippedNapSlots]);

  // Filter to only naps and bedtime (no awake blocks - whitespace implies awake)
  const displayEvents = useMemo(() => {
    return events.filter((e) => e.type === 'nap' || e.type === 'bedtime');
  }, [events]);

  // Full 24-hour timeline bounds
  const timelineBounds = useMemo(() => {
    return {
      start: 0, // 00:00
      end: 24 * 60, // 24:00
      startHour: 0,
      endHour: 24,
    };
  }, []);

  // Generate time axis labels (hourly) for full 24h
  const timeMarkers = useMemo(() => {
    const markers = [];
    for (let hour = 0; hour <= 24; hour++) {
      markers.push({
        minutes: hour * 60,
        isHour: true,
        label: `${hour.toString().padStart(2, '0')}:00`,
      });
    }
    return markers;
  }, []);

  const totalHeight = (timelineBounds.end - timelineBounds.start) * PIXELS_PER_MINUTE;

  // Calculate pixel position for a time
  const getPositionPx = useCallback((minutes) => {
    return (minutes - timelineBounds.start) * PIXELS_PER_MINUTE;
  }, [timelineBounds]);

  // Scroll to ~06:00 on mount
  useEffect(() => {
    if (scrollRef.current) {
      const scrollTo = 6 * 60 * PIXELS_PER_MINUTE - 20; // 6:00 minus a bit of padding
      scrollRef.current.scrollTop = Math.max(0, scrollTo);
    }
  }, []);

  // Handle drag updates from TimelineEvent
  const handleDragUpdate = useCallback((event, updates) => {
    // Get the actual nap ID from the event
    const napId = event.actualData?.id || event.id;
    if (napId && !napId.startsWith('predicted')) {
      updateNap(napId, updates);
    }
  }, [updateNap]);

  // Handle skip predicted nap
  const handleSkip = useCallback((event) => {
    if (event.slotIndex !== undefined) {
      skipNapSlot(event.slotIndex);
    }
  }, [skipNapSlot]);

  // Handle tap on empty grid area to create a new nap
  const handleGridClick = useCallback((e) => {
    // Only handle clicks directly on the grid, not on events
    if (e.target !== e.currentTarget) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const minutes = Math.round(y / PIXELS_PER_MINUTE);
    const roundedMinutes = Math.round(minutes / 5) * 5; // Snap to 5-minute intervals
    const startTime = formatTime24(roundedMinutes);
    const endTime = formatTime24(roundedMinutes + 30); // Default 30-min nap

    onAddNap(startTime, endTime);
  }, [onAddNap]);

  return (
    <div className="timeline">
      <header className="timeline-header">
        <div className="timeline-date">{formatDateDisplay(date)}</div>
        <div className="timeline-title">{isCurrentDay ? 'Today' : 'Past Day'}</div>

        <div className="timeline-times">
          <div className="timeline-time-row">
            <SunIcon />
            <span className="timeline-time-label">Wake</span>
            <button className="timeline-time-button" onClick={onEditWakeTime}>
              {wakeTime}
              <span className="timeline-time-edit">Edit</span>
            </button>
          </div>

          <div className="timeline-time-row">
            <MoonIcon />
            <span className="timeline-time-label">Bedtime</span>
            <button className="timeline-time-button" onClick={onEditBedtime}>
              {bedtime}
              <span className="timeline-time-edit">Edit</span>
            </button>
          </div>
        </div>
      </header>

      <div className="timeline-body" ref={scrollRef}>
        <div className="timeline-scroll-container">
          <div className="timeline-axis" style={{ height: totalHeight }}>
            {timeMarkers.map(({ minutes, isHour, label }) => (
              <div
                key={minutes}
                className={`timeline-marker ${isHour ? 'timeline-marker-hour' : 'timeline-marker-half'}`}
                style={{ top: getPositionPx(minutes) }}
              >
                {label && <span className="timeline-marker-label">{label}</span>}
                <span className="timeline-marker-tick" />
              </div>
            ))}
          </div>

          <div
            className="timeline-events"
            style={{ height: totalHeight }}
            onClick={handleGridClick}
          >
            {/* Grid lines background */}
            <div className="timeline-grid">
              {timeMarkers.map(({ minutes }) => (
                <div
                  key={`grid-${minutes}`}
                  className="timeline-grid-line"
                  style={{ top: getPositionPx(minutes) }}
                />
              ))}
            </div>

            {/* Morning night gradient - from midnight to wake time */}
            <div
              className="morning-night-fill"
              style={{
                top: 0,
                height: getPositionPx(parseTime(wakeTime)),
              }}
            />

            {displayEvents.map((event) => (
              <TimelineEvent
                key={event.id}
                event={event}
                getPositionPx={getPositionPx}
                onEdit={onEditNap}
                onAdd={onAddNap}
                onSkip={handleSkip}
                onDragUpdate={handleDragUpdate}
                timelineBounds={timelineBounds}
              />
            ))}

            {isCurrentDay && (
              <CurrentTimeIndicator
                currentTime={currentTime}
                getPositionPx={getPositionPx}
                bounds={timelineBounds}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
