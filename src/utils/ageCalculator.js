/**
 * Calculate age in months from birthday
 */
export function calculateAgeInMonths(birthdayStr) {
  if (!birthdayStr) return null;

  const birthday = new Date(birthdayStr + 'T12:00:00');
  const today = new Date();

  let months = (today.getFullYear() - birthday.getFullYear()) * 12;
  months += today.getMonth() - birthday.getMonth();

  // Adjust if birthday hasn't occurred this month yet
  if (today.getDate() < birthday.getDate()) {
    months--;
  }

  return Math.max(0, months);
}

/**
 * Format age for display (e.g., "4 months", "1 year 2 months")
 */
export function formatAge(birthdayStr) {
  const months = calculateAgeInMonths(birthdayStr);
  if (months === null) return '';

  if (months < 12) {
    return `${months} month${months !== 1 ? 's' : ''}`;
  }

  const years = Math.floor(months / 12);
  const remainingMonths = months % 12;

  if (remainingMonths === 0) {
    return `${years} year${years !== 1 ? 's' : ''}`;
  }

  return `${years} year${years !== 1 ? 's' : ''} ${remainingMonths} month${remainingMonths !== 1 ? 's' : ''}`;
}
