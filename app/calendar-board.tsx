import { Cake, CalendarDays, ChevronLeft, ChevronRight, Clock3, Plus } from "lucide-react";
import Link from "next/link";
import { shiftDate, type CalendarEvent, type ScheduleEntry } from "../lib/data";
import type { calendarWindow } from "../lib/calendar";
import { updateBoard } from "./actions";
import { ActionForm, Submit } from "./forms";

const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const monthLabel = new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric", timeZone: "UTC" });
const dayLabel = new Intl.DateTimeFormat("en-US", { dateStyle: "full", timeZone: "UTC" });
const clock = new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit", timeZone: "UTC" });
const asDate = (date: string) => new Date(`${date}T12:00:00Z`);
const timeLabel = (time: string) => clock.format(new Date(`2000-01-01T${time}:00Z`));
const href = (day: string) => `/?section=calendar&day=${day}`;

function occursOn(event: CalendarEvent, date: string) {
  if (event.kind === "event") return event.date === date;
  if (event.date === date.slice(5)) return true;
  return event.date === "02-29" && date.slice(5) === "02-28" && shiftDate(date, 1).endsWith("03-01");
}

function EventFields({ day, event }: { day: string; event?: CalendarEvent }) {
  const date = event?.kind === "birthday"
    ? `${event.date === "02-29" ? "2000" : day.slice(0, 4)}-${event.date}`
    : event?.date ?? day;
  return <>
    <label>Name<input name="title" defaultValue={event?.title} required maxLength={80} placeholder="e.g. Mom’s birthday" /></label>
    <label>Type<select name="kind" defaultValue={event?.kind ?? "event"}>
      <option value="event">Event</option>
      <option value="birthday">Birthday · repeats yearly</option>
    </select></label>
    <label>Date<input type="date" name="date" defaultValue={date} required /></label>
    <label>Time (events only)<input type="time" name="time" defaultValue={event?.time} /></label>
    <label>Note<input name="note" defaultValue={event?.note} maxLength={100} placeholder="Optional" /></label>
  </>;
}

export function CalendarBoard({ window, today, events, schedule, people }: {
  window: ReturnType<typeof calendarWindow>;
  today: string;
  events: CalendarEvent[];
  schedule: ScheduleEntry[];
  people: { id: string; name: string }[];
}) {
  const { day, monthStart, first, last, previous, next } = window;
  const days = [];
  for (let date = first; date <= last; date = shiftDate(date, 1)) {
    days.push({
      date,
      events: events.filter((event) => occursOn(event, date)).sort((a, b) => a.time.localeCompare(b.time)),
      availability: schedule.filter((entry) => entry.starts_at.slice(0, 10) <= date && entry.ends_at.slice(0, 10) >= date),
    });
  }
  const selected = days.find((item) => item.date === day);
  const nameOf = (id: string) => people.find((person) => person.id === id)?.name ?? "Former member";

  return <section className="household-calendar" aria-labelledby="calendar-month">
    <div className="section-head">
      <div><h2 id="calendar-month">{monthLabel.format(asDate(monthStart))}</h2></div>
      <details className="quick-form" key={day}>
        <summary><Plus size={17} /> Add event or birthday</summary>
        <ActionForm action={updateBoard} intent="calendar-add" className="entry-form" feedback>
          <EventFields day={day} />
          <Submit>Save entry</Submit>
        </ActionForm>
      </details>
    </div>
    <div className="lane calendar-card">
      <nav className="calendar-controls" aria-label="Calendar month">
        <Link className="button secondary" href={href(previous)} aria-label="Previous month"><ChevronLeft size={18} /></Link>
        <Link className="button secondary" href={href(today)}>Today</Link>
        <Link className="button secondary" href={href(next)} aria-label="Next month"><ChevronRight size={18} /></Link>
        <a className="button secondary" href="#availability">Home / Away</a>
      </nav>
      <div className="calendar-grid">
        {weekdays.map((name) => <span className="calendar-weekday" key={name}>{name}</span>)}
        {days.map(({ date, events, availability }) => <Link key={date} href={href(date)}
          className={`calendar-day ${date.slice(0, 7) !== day.slice(0, 7) ? "outside-month" : ""}`}
          aria-current={date === day ? "date" : undefined}
          aria-label={`${dayLabel.format(asDate(date))}, ${events.length} calendar entries, ${availability.length} availability blocks`}>
          <span className="calendar-date">{Number(date.slice(8))}</span>
          {events.length > 0 && <span className={`calendar-marker ${events[0].kind}`}>{events[0].title}</span>}
          {availability.length > 0 && <span className="calendar-marker availability">{availability.length} availability</span>}
          {events.length > 1 && <small className="calendar-extra">+{events.length - 1}</small>}
        </Link>)}
      </div>
    </div>
    <div className="lane calendar-agenda">
      <div className="lane-heading"><span className="lane-icon maintain"><CalendarDays size={18} /></span>
        <h3>{dayLabel.format(asDate(day))}</h3>
      </div>
      {!selected?.events.length && !selected?.availability.length && <p className="empty">Nothing on the calendar for this day.</p>}
      <ul className="items">
        {selected?.events.map((event) => <li className="item" key={event.id}>
          <div className="item-title"><strong>{event.title}</strong>
            <span className={`tag ${event.kind === "birthday" ? "buy" : "maintain"}`}>
              {event.kind === "birthday" ? "Birthday · yearly" : event.time ? timeLabel(event.time) : "All day"}
            </span>
          </div>
          {event.note && <p className="item-meta">{event.note}</p>}
          <div className="item-actions">
            <details className="edit-form">
              <summary>Edit</summary>
              <ActionForm action={updateBoard} intent="calendar-edit" id={event.id} className="entry-form" feedback>
                <EventFields day={day} event={event} /><Submit variant="secondary">Save changes</Submit>
              </ActionForm>
            </details>
            <ActionForm action={updateBoard} intent="calendar-remove" id={event.id}>
              <Submit variant="danger">Remove</Submit>
            </ActionForm>
          </div>
        </li>)}
        {selected?.availability.map((entry) => {
          const from = entry.starts_at.startsWith(day) ? timeLabel(entry.starts_at.slice(11, 16)) : "From previous day";
          const until = entry.ends_at.startsWith(day) ? timeLabel(entry.ends_at.slice(11, 16)) : "Continues tomorrow";
          return <li className="item" key={`${entry.id}-${entry.starts_at}`}>
            <div className="item-title"><strong>{nameOf(entry.member_id)}</strong>
              <span className={`tag ${entry.status === "home" ? "maintain" : "buy"}`}>{entry.status === "home" ? "Home" : "Away"}</span>
            </div>
            <p className="item-meta"><Clock3 size={15} />{from} – {until}{entry.note && ` · ${entry.note}`}</p>
          </li>;
        })}
      </ul>
      {selected?.events.some((event) => event.kind === "birthday") && <div className="birthday-note"><Cake size={15} /> Birthdays repeat every year.</div>}
    </div>
  </section>;
}
