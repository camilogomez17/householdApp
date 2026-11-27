import { shiftDate } from "./data";

export function calendarWindow(today: string, selection?: string) {
  const valid = selection && /^20\d\d-\d\d-\d\d$/.test(selection)
    && !Number.isNaN(Date.parse(selection)) && new Date(selection).toISOString().slice(0, 10) === selection;
  const day = valid ? selection : today;
  const monthStart = `${day.slice(0, 7)}-01`;
  const monthDate = new Date(`${monthStart}T12:00:00Z`);
  const previous = new Date(monthDate);
  previous.setUTCMonth(previous.getUTCMonth() - 1);
  const next = new Date(monthDate);
  next.setUTCMonth(next.getUTCMonth() + 1);
  const first = shiftDate(monthStart, -monthDate.getUTCDay());
  return {
    day, monthStart, first, last: shiftDate(first, 41),
    previous: previous.toISOString().slice(0, 10),
    next: next.toISOString().slice(0, 10),
  };
}
