/**
 * Formats a duration in seconds into a concise human-readable label (e.g., "45s", "3m 12s", "1h 5m").
 */
export function formatDurationSeconds(seconds?: number | null): string {
  if (seconds === null || seconds === undefined || Number.isNaN(seconds) || seconds < 0) {
    return '—';
  }

  const total = Math.round(seconds);
  if (total < 60) {
    return `${total}s`;
  }

  const mins = Math.floor(total / 60);
  const secs = total % 60;
  if (mins < 60) {
    return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
  }

  const hours = Math.floor(mins / 60);
  const remMins = mins % 60;
  return remMins > 0 ? `${hours}h ${remMins}m` : `${hours}h`;
}
