import { useMemo } from 'react';
import { useAppState } from '../hooks/useAppState';
import { formatDuration, parseTime } from '../utils/timeUtils';
import './HistoryView.css';

export default function HistoryView({ onSelectDay }) {
  const { settings, getHistoryDays } = useAppState();
  const historyDays = getHistoryDays();

  // Calculate stats from history
  const stats = useMemo(() => {
    if (historyDays.length === 0) {
      return {
        avgWakeTime: null,
        avgWakeTimeVariance: null,
        avgNapsPerDay: null,
        avgTotalNapDuration: null,
        avgBedtime: null,
        avgBedtimeVariance: null,
      };
    }

    // Wake times
    const wakeTimes = historyDays
      .filter((d) => d.actualWakeTime)
      .map((d) => parseTime(d.actualWakeTime));

    const avgWakeTime =
      wakeTimes.length > 0
        ? wakeTimes.reduce((a, b) => a + b, 0) / wakeTimes.length
        : null;

    const wakeTimeVariance =
      wakeTimes.length > 1
        ? Math.sqrt(
            wakeTimes.reduce((sum, t) => sum + Math.pow(t - avgWakeTime, 2), 0) /
              wakeTimes.length
          )
        : null;

    // Naps
    const napsPerDay = historyDays.map((d) => d.sessions.filter((s) => s.type === 'nap').length);
    const avgNapsPerDay =
      napsPerDay.length > 0
        ? napsPerDay.reduce((a, b) => a + b, 0) / napsPerDay.length
        : null;

    // Total nap duration
    const napDurations = historyDays.map((d) => {
      return d.sessions
        .filter((s) => s.type === 'nap' && s.endTime)
        .reduce((total, s) => total + (parseTime(s.endTime) - parseTime(s.startTime)), 0);
    });
    const avgTotalNapDuration =
      napDurations.filter((d) => d > 0).length > 0
        ? napDurations.filter((d) => d > 0).reduce((a, b) => a + b, 0) /
          napDurations.filter((d) => d > 0).length
        : null;

    // Bedtimes
    const bedtimes = historyDays
      .filter((d) => d.actualBedtime)
      .map((d) => parseTime(d.actualBedtime));

    const avgBedtime =
      bedtimes.length > 0
        ? bedtimes.reduce((a, b) => a + b, 0) / bedtimes.length
        : null;

    const bedtimeVariance =
      bedtimes.length > 1
        ? Math.sqrt(
            bedtimes.reduce((sum, t) => sum + Math.pow(t - avgBedtime, 2), 0) /
              bedtimes.length
          )
        : null;

    return {
      avgWakeTime,
      avgWakeTimeVariance: wakeTimeVariance,
      avgNapsPerDay,
      avgTotalNapDuration,
      avgBedtime,
      avgBedtimeVariance: bedtimeVariance,
    };
  }, [historyDays]);

  // Group days by week
  const groupedDays = useMemo(() => {
    const groups = {};
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    historyDays.forEach((day) => {
      const dayDate = new Date(day.date + 'T12:00:00');
      const diffDays = Math.floor((today - dayDate) / (1000 * 60 * 60 * 24));

      let groupKey;
      if (diffDays === 0) {
        groupKey = 'Today';
      } else if (diffDays < 7) {
        groupKey = 'This Week';
      } else if (diffDays < 14) {
        groupKey = 'Last Week';
      } else {
        groupKey = 'Earlier';
      }

      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(day);
    });

    return groups;
  }, [historyDays]);

  const formatMinutesToTime = (minutes) => {
    if (minutes === null) return '—';
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    const period = hours < 12 ? 'AM' : 'PM';
    const hours12 = hours % 12 || 12;
    return `${hours12}:${mins.toString().padStart(2, '0')} ${period}`;
  };

  const formatVariance = (variance) => {
    if (variance === null) return '';
    return `±${Math.round(variance)} min`;
  };

  return (
    <div className="history-view">
      <header className="history-header">
        <h1 className="history-title">History</h1>
        <p className="history-subtitle">Last 30 days</p>
      </header>

      <div className="history-content">
        <div className="stats-grid">
          <div className="stat-card">
            <span className="stat-value">{formatMinutesToTime(stats.avgWakeTime)}</span>
            <span className="stat-variance">{formatVariance(stats.avgWakeTimeVariance)}</span>
            <span className="stat-label">Avg Wake Time</span>
          </div>

          <div className="stat-card">
            <span className="stat-value">
              {stats.avgNapsPerDay !== null ? stats.avgNapsPerDay.toFixed(1) : '—'}
            </span>
            <span className="stat-variance">
              {stats.avgTotalNapDuration ? formatDuration(stats.avgTotalNapDuration) + ' total' : ''}
            </span>
            <span className="stat-label">Avg Naps/Day</span>
          </div>

          <div className="stat-card">
            <span className="stat-value">{formatMinutesToTime(stats.avgBedtime)}</span>
            <span className="stat-variance">{formatVariance(stats.avgBedtimeVariance)}</span>
            <span className="stat-label">Avg Bedtime</span>
          </div>

          <div className="stat-card">
            <span className="stat-value">{settings.schedule.defaultWakeWindow} hrs</span>
            <span className="stat-variance">Current setting</span>
            <span className="stat-label">Wake Window</span>
          </div>
        </div>

        {Object.entries(groupedDays).map(([groupName, days]) => (
          <div key={groupName} className="history-group">
            <h2 className="group-title">{groupName}</h2>
            <div className="day-list">
              {days.map((day) => (
                <DayItem key={day.date} day={day} onClick={() => onSelectDay(day.date)} />
              ))}
            </div>
          </div>
        ))}

        {historyDays.length === 0 && (
          <div className="history-empty">
            <p>No history yet.</p>
            <p>Start tracking naps to see your data here.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function DayItem({ day, onClick }) {
  const naps = day.sessions.filter((s) => s.type === 'nap');
  const totalNapTime = naps
    .filter((s) => s.endTime)
    .reduce((total, s) => total + (parseTime(s.endTime) - parseTime(s.startTime)), 0);

  const date = new Date(day.date + 'T12:00:00');
  const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const weekday = date.toLocaleDateString('en-US', { weekday: 'long' });

  const formatShortTime = (timeStr) => {
    if (!timeStr) return '—';
    const [hours, mins] = timeStr.split(':').map(Number);
    const hours12 = hours % 12 || 12;
    return `${hours12}:${mins.toString().padStart(2, '0')}`;
  };

  return (
    <button className="day-item" onClick={onClick}>
      <div className="day-date">
        <span className="day-date-main">{dateStr}</span>
        <span className="day-weekday">{weekday}</span>
      </div>

      <div className="day-summary">
        <div className="summary-col">
          <span className="summary-label">Woke</span>
          <span className="summary-value">{formatShortTime(day.actualWakeTime)}</span>
        </div>

        <div className="summary-col summary-col-naps">
          <span className="summary-label">Naps</span>
          <div className="nap-dots">
            {naps.map((_, i) => (
              <span key={i} className="nap-dot" />
            ))}
            {naps.length === 0 && <span className="summary-value">—</span>}
          </div>
        </div>

        <div className="summary-col">
          <span className="summary-label">Sleep</span>
          <span className="summary-value">
            {totalNapTime > 0 ? formatDuration(totalNapTime) : '—'}
          </span>
        </div>

        <div className="summary-col">
          <span className="summary-label">Bed</span>
          <span className="summary-value">{formatShortTime(day.actualBedtime)}</span>
        </div>
      </div>

      <span className="day-chevron">›</span>
    </button>
  );
}
