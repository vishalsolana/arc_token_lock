// Date pickers on this site collect a date only, not a time — a lock/extension covers the whole
// chosen day, unlocking right after it ends (23:59:59 local time). This also sidesteps a real
// gotcha: defaulting to the start of the day would make "today" fail a future-date check the
// moment any time has already passed that day.

// date input's value/min need local-time wall-clock components, not a UTC ISO string — using
// toISOString() here would silently shift dates by the viewer's UTC offset.
export function toDateValue(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function endOfDayTimestamp(dateStr: string): number {
  return Math.floor(new Date(`${dateStr}T23:59:59`).getTime() / 1000);
}
