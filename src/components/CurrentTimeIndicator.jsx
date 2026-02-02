import { formatTimeDisplay } from '../utils/timeUtils';
import './CurrentTimeIndicator.css';

export default function CurrentTimeIndicator({ currentTime, getPositionPx, bounds }) {
  // Don't show if outside timeline bounds
  if (currentTime < bounds.start || currentTime > bounds.end) {
    return null;
  }

  const top = getPositionPx(currentTime);

  return (
    <div className="current-time-indicator" style={{ top }}>
      <div className="current-time-dot" />
      <div className="current-time-line" />
      <div className="current-time-label">{formatTimeDisplay(currentTime)}</div>
    </div>
  );
}
