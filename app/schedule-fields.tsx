import type { ScheduleEntry } from "../lib/data";

export const scheduleWeekdays = [
  { id: 1, label: "Mon" }, { id: 2, label: "Tue" }, { id: 3, label: "Wed" },
  { id: 4, label: "Thu" }, { id: 5, label: "Fri" }, { id: 6, label: "Sat" }, { id: 0, label: "Sun" },
];

export function ScheduleFields({ today, entry }: { today: string; entry?: ScheduleEntry }) {
  const startDate = entry?.starts_at.slice(0, 10) ?? today;
  const endDate = entry?.ends_at.slice(0, 10);
  return <>
    <label>Availability<select name="status" defaultValue={entry?.status ?? "home"}><option value="home">Home</option><option value="away">Away</option></select></label>
    <label>Date<input name="startDate" type="date" defaultValue={startDate} required /></label>
    <label>Start time<input name="startTime" type="time" defaultValue={entry?.starts_at.slice(11)} required /></label>
    <label>End time<input name="endTime" type="time" defaultValue={entry?.ends_at.slice(11)} required /></label>
    <label>Note<input name="note" defaultValue={entry?.note} maxLength={100} placeholder="Optional" /></label>
    <details className="schedule-options" open={Boolean(entry?.repeat_on?.length || (endDate && endDate !== startDate))}>
      <summary>Repeat or overnight</summary>
      <label>End date (overnight only)<input name="endDate" type="date" defaultValue={endDate !== startDate ? endDate : ""} /></label>
      <fieldset className="repeat-days">
        <legend>Repeat weekly on</legend>
        <p>Leave all days unchecked for a one-time entry.</p>
        <div>
          {scheduleWeekdays.map(({ id, label }) => <label key={id}>
            <input type="checkbox" name="repeatDay" value={id} defaultChecked={entry?.repeat_on?.includes(id)} /> {label}
          </label>)}
        </div>
      </fieldset>
    </details>
  </>;
}
