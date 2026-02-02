import { useState } from 'react';
import { parseTime, formatTime24 } from '../utils/timeUtils';
import './TimePicker.css';

export default function TimePicker({ value, onChange, onClose, title, showDelete, onDelete }) {
  const initialMinutes = value ? parseTime(value) : parseTime('08:00');
  const [hours, setHours] = useState(Math.floor(initialMinutes / 60));
  const [minutes, setMinutes] = useState(initialMinutes % 60);

  const handleSave = () => {
    onChange(formatTime24(hours * 60 + minutes));
    onClose();
  };

  const handleHoursChange = (e) => {
    const val = parseInt(e.target.value, 10);
    if (!isNaN(val) && val >= 0 && val <= 23) {
      setHours(val);
    }
  };

  const handleMinutesChange = (e) => {
    const val = parseInt(e.target.value, 10);
    if (!isNaN(val) && val >= 0 && val <= 59) {
      setMinutes(Math.round(val / 5) * 5);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <button className="modal-cancel" onClick={onClose}>
            Cancel
          </button>
          <span className="modal-title">{title || 'Set Time'}</span>
          <button className="modal-save" onClick={handleSave}>
            Save
          </button>
        </div>

        <div className="time-picker-content">
          <div className="time-picker-inputs">
            <div className="time-input-group">
              <input
                type="number"
                min="0"
                max="23"
                value={hours.toString().padStart(2, '0')}
                onChange={handleHoursChange}
                className="time-input"
              />
              <span className="time-input-label">Hours</span>
            </div>

            <span className="time-separator">:</span>

            <div className="time-input-group">
              <input
                type="number"
                min="0"
                max="55"
                step="5"
                value={minutes.toString().padStart(2, '0')}
                onChange={handleMinutesChange}
                className="time-input"
              />
              <span className="time-input-label">Minutes</span>
            </div>
          </div>

          {showDelete && (
            <button
              className="delete-button"
              onClick={() => {
                onDelete();
                onClose();
              }}
            >
              Delete Nap
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
