/**
 * Parse a time string (HH:MM) into minutes since midnight
 */
export function parseTime(timeStr) {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
}

/**
 * Convert minutes since midnight to time string (HH:MM)
 */
export function formatTime24(minutes) {
  const hours = Math.floor(minutes / 60) % 24;
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

/**
 * Format minutes since midnight to display time (24h format, e.g., "08:05")
 */
export function formatTimeDisplay(minutes) {
  return formatTime24(minutes);
}

/**
 * Format a time range for display (24h format, e.g., "08:05–08:35")
 */
export function formatTimeRange(startMinutes, endMinutes) {
  return `${formatTime24(startMinutes)}–${formatTime24(endMinutes)}`;
}

/**
 * Format duration in minutes to display (e.g., "1h 30m" or "30 min")
 */
export function formatDuration(minutes) {
  if (minutes < 60) {
    return `${Math.round(minutes)} min`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  if (mins === 0) {
    return `${hours}h`;
  }
  return `${hours}h ${mins}m`;
}

/**
 * Get current time as minutes since midnight
 */
export function getCurrentTimeMinutes() {
  const now = new Date();
  return now.getHours() * 60 + now.getMinutes();
}

/**
 * Get today's date as ISO string (YYYY-MM-DD)
 */
export function getTodayISO() {
  return new Date().toISOString().split('T')[0];
}

/**
 * Format a date for display (e.g., "Sunday, February 2")
 */
export function formatDateDisplay(dateStr) {
  const date = new Date(dateStr + 'T12:00:00');
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric'
  });
}

/**
 * Check if a date string is today
 */
export function isToday(dateStr) {
  return dateStr === getTodayISO();
}

/**
 * Add hours to minutes since midnight
 */
export function addHours(minutes, hours) {
  return minutes + hours * 60;
}

/**
 * Round minutes to nearest 5-minute increment
 */
export function roundToNearest5(minutes) {
  return Math.round(minutes / 5) * 5;
}
