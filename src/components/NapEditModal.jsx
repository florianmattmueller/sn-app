import { useState } from 'react';
import { parseTime, formatTime24, formatTimeDisplay } from '../utils/timeUtils';
import './NapEditModal.css';

export default function NapEditModal({ nap, onSave, onDelete, onClose }) {
  // Handle both string times and numeric minutes
  const getStartMinutes = () => {
    if (nap.startTime) return parseTime(nap.startTime);
    if (typeof nap.start === 'number') return nap.start;
    return parseTime('08:00');
  };

  const getEndMinutes = () => {
    if (nap.endTime) return parseTime(nap.endTime);
    if (typeof nap.end === 'number') return nap.end;
    return null;
  };

  const [startMinutes, setStartMinutes] = useState(getStartMinutes);
  const [endMinutes, setEndMinutes] = useState(getEndMinutes);

  const handleSave = () => {
    onSave({
      startTime: formatTime24(startMinutes),
      endTime: endMinutes ? formatTime24(endMinutes) : null,
    });
    onClose();
  };

  const adjustTime = (setter, current, delta) => {
    setter(Math.max(0, Math.min(24 * 60 - 5, current + delta)));
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <button className="modal-cancel" onClick={onClose}>
            Cancel
          </button>
          <span className="modal-title">Edit Nap</span>
          <button className="modal-save" onClick={handleSave}>
            Save
          </button>
        </div>

        <div className="nap-edit-content">
          <div className="time-row">
            <span className="time-row-label">Start</span>
            <div className="time-adjuster">
              <button
                className="time-adjust-btn"
                onClick={() => adjustTime(setStartMinutes, startMinutes, -5)}
              >
                -
              </button>
              <span className="time-value">{formatTimeDisplay(startMinutes)}</span>
              <button
                className="time-adjust-btn"
                onClick={() => adjustTime(setStartMinutes, startMinutes, 5)}
              >
                +
              </button>
            </div>
          </div>

          <div className="time-row">
            <span className="time-row-label">End</span>
            <div className="time-adjuster">
              <button
                className="time-adjust-btn"
                onClick={() => adjustTime(setEndMinutes, endMinutes || startMinutes + 30, -5)}
              >
                -
              </button>
              <span className="time-value">
                {endMinutes ? formatTimeDisplay(endMinutes) : '—'}
              </span>
              <button
                className="time-adjust-btn"
                onClick={() => adjustTime(setEndMinutes, endMinutes || startMinutes + 30, 5)}
              >
                +
              </button>
            </div>
          </div>

          {!endMinutes && (
            <button
              className="end-nap-button"
              onClick={() => setEndMinutes(startMinutes + 30)}
            >
              Set End Time
            </button>
          )}

          <button
            className="delete-button"
            onClick={() => {
              onDelete();
              onClose();
            }}
          >
            Delete Nap
          </button>
        </div>
      </div>
    </div>
  );
}
