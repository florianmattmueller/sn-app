import { useState, useRef, useCallback } from 'react';
import { formatTimeRange, formatDuration, formatTime24, roundToNearest5 } from '../utils/timeUtils';
import './TimelineEvent.css';

const PIXELS_PER_MINUTE = 0.7;
const MIN_NAP_DURATION = 10; // minimum 10 minutes
const MIN_BLOCK_HEIGHT = 36; // minimum visual height for nap blocks

// Zzz sleep icon
const SleepIcon = () => (
  <svg className="event-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 4h5l-5 4h5" />
    <path d="M9 9h4l-4 3h4" />
  </svg>
);

// Crescent moon with stars for bedtime
const MoonStarsIcon = () => (
  <svg className="event-icon" viewBox="0 0 16 16" fill="currentColor">
    <path d="M6 0a6 6 0 0 0 0 12 6 6 0 0 0 6-6 4.5 4.5 0 0 1-6-6z" transform="translate(0 2)" />
    <circle cx="11" cy="3" r="1" />
    <circle cx="14" cy="5" r="0.8" />
    <circle cx="12" cy="8" r="0.6" />
  </svg>
);

// X icon for skip button
const CloseIcon = () => (
  <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M2 2l8 8M10 2l-8 8" />
  </svg>
);

export default function TimelineEvent({
  event,
  getPositionPx,
  onEdit,
  onAdd,
  onSkip,
  onDragUpdate,
  timelineBounds
}) {
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(null); // 'top' | 'bottom' | null
  const [dragOffset, setDragOffset] = useState({ start: 0, end: 0 });
  const dragStartRef = useRef(null);
  const hasDraggedRef = useRef(false);

  // Convert pixels to minutes
  const pxToMinutes = useCallback((px) => {
    return px / PIXELS_PER_MINUTE;
  }, []);

  const handlePointerDown = useCallback((e, mode = 'move') => {
    // Predicted naps: only allow click, not drag
    if (event.status === 'predicted' && mode !== 'move') return;

    e.preventDefault();
    e.stopPropagation();

    const target = e.currentTarget;
    target.setPointerCapture(e.pointerId);

    hasDraggedRef.current = false;
    dragStartRef.current = {
      y: e.clientY,
      startMinutes: event.start,
      endMinutes: event.end,
      mode,
    };

    if (event.status !== 'predicted') {
      if (mode === 'move') {
        setIsDragging(true);
      } else {
        setIsResizing(mode);
      }
    }
  }, [event]);

  const handlePointerMove = useCallback((e) => {
    if (!dragStartRef.current) return;
    if (event.status === 'predicted') return;

    const deltaY = e.clientY - dragStartRef.current.y;

    // Only start dragging after moving more than 5px
    if (Math.abs(deltaY) > 5) {
      hasDraggedRef.current = true;
    }

    const deltaMinutes = roundToNearest5(pxToMinutes(deltaY));
    const { mode, startMinutes, endMinutes } = dragStartRef.current;

    if (mode === 'move') {
      const newStart = startMinutes + deltaMinutes;
      const newEnd = endMinutes + deltaMinutes;

      if (newStart >= timelineBounds.start && newEnd <= timelineBounds.end) {
        setDragOffset({
          start: deltaMinutes,
          end: deltaMinutes
        });
      }
    } else if (mode === 'top') {
      const newStart = startMinutes + deltaMinutes;
      const duration = endMinutes - newStart;

      if (newStart >= timelineBounds.start && duration >= MIN_NAP_DURATION) {
        setDragOffset({
          start: deltaMinutes,
          end: 0
        });
      }
    } else if (mode === 'bottom') {
      const newEnd = endMinutes + deltaMinutes;
      const duration = newEnd - startMinutes;

      if (newEnd <= timelineBounds.end && duration >= MIN_NAP_DURATION) {
        setDragOffset({
          start: 0,
          end: deltaMinutes
        });
      }
    }
  }, [event.status, pxToMinutes, timelineBounds]);

  const handlePointerUp = useCallback((e) => {
    if (!dragStartRef.current) return;

    const target = e.currentTarget;
    target.releasePointerCapture(e.pointerId);

    const wasDragging = hasDraggedRef.current;
    const { startMinutes, endMinutes } = dragStartRef.current;

    // Handle click vs drag
    if (!wasDragging) {
      // This was a tap/click
      if (event.status === 'predicted') {
        onAdd(formatTime24(event.start), formatTime24(event.end));
      } else {
        onEdit(event);
      }
    } else if (event.status !== 'predicted') {
      // This was a drag - update the nap
      const newStart = startMinutes + dragOffset.start;
      const newEnd = endMinutes + dragOffset.end;

      if (dragOffset.start !== 0 || dragOffset.end !== 0) {
        onDragUpdate(event, {
          startTime: formatTime24(newStart),
          endTime: formatTime24(newEnd),
        });
      }
    }

    dragStartRef.current = null;
    hasDraggedRef.current = false;
    setIsDragging(false);
    setIsResizing(null);
    setDragOffset({ start: 0, end: 0 });
  }, [event, dragOffset, onDragUpdate, onAdd, onEdit]);

  const handleSkip = (e) => {
    e.stopPropagation();
    onSkip(event);
  };

  // Calculate position with drag offset
  const currentStart = event.start + dragOffset.start;
  const currentEnd = event.end + dragOffset.end;
  const top = getPositionPx(currentStart);
  const height = getPositionPx(currentEnd) - top;
  const duration = currentEnd - currentStart;

  // Nap block
  if (event.type === 'nap') {
    const isPredicted = event.status === 'predicted';
    const isInProgress = event.status === 'in-progress';
    const isConflict = event.conflict;
    const isInteracting = isDragging || isResizing;

    const classes = ['nap-block'];
    if (isPredicted) classes.push('nap-predicted');
    if (isInProgress) classes.push('nap-in-progress');
    if (isConflict) classes.push('nap-conflict');
    if (!isPredicted && !isInProgress) classes.push('nap-actual');
    if (isInteracting) classes.push('nap-dragging');

    return (
      <div
        className={classes.join(' ')}
        style={{ top, height: Math.max(height, MIN_BLOCK_HEIGHT) }}
      >
        {/* Top resize handle - only for actual naps */}
        {!isPredicted && (
          <div
            className="nap-handle nap-handle-top"
            onPointerDown={(e) => handlePointerDown(e, 'top')}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
          />
        )}

        {/* Main area - tap to edit/confirm, drag to move */}
        <div
          className="nap-drag-area"
          onPointerDown={(e) => handlePointerDown(e, 'move')}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
        >
          <div className="nap-content">
            <SleepIcon />
            <span className="nap-time">{formatTimeRange(currentStart, currentEnd)}</span>
            <span className="nap-duration">{formatDuration(duration)}</span>
          </div>
        </div>

        {/* Skip button for predicted naps */}
        {isPredicted && (
          <button className="nap-skip-btn" onClick={handleSkip} title="Skip this nap">
            <CloseIcon />
          </button>
        )}

        {/* Bottom resize handle - only for actual naps */}
        {!isPredicted && (
          <div
            className="nap-handle nap-handle-bottom"
            onPointerDown={(e) => handlePointerDown(e, 'bottom')}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
          />
        )}

        {isConflict && <span className="nap-conflict-badge">Conflicts with bedtime</span>}
      </div>
    );
  }

  // Bedtime - just the night gradient fill (no harsh line)
  if (event.type === 'bedtime') {
    // Night extends from bedtime to end of day (24:00 = 1440 minutes)
    const nightHeight = getPositionPx(1440) - top;

    return (
      <div
        className="night-fill"
        style={{
          top,
          height: nightHeight,
        }}
      />
    );
  }

  return null;
}
