import { Cake, ChevronLeft, ChevronRight, Clock3, Plus } from "lucide-react";
import Link from "next/link";
import { shiftDate, type CalendarEvent, type ScheduleEntry } from "../lib/data";
import { birthdayInYear, nextBirthday, type calendarWindow } from "../lib/calendar";
import { updateBoard } from "./actions";
import { ActionForm, Submit } from "./forms";
import { CalendarAdd } from "./calendar-add";
import { ScheduleFields } from "./schedule-fields";

const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const monthLabel = new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric", timeZone: "UTC" });
const dayLabel = new Intl.DateTimeFormat("en-US", { dateStyle: "full", timeZone: "UTC" });
const birthdayLabel = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
const clock = new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit", timeZone: "UTC" });
const asDate = (date: string) => new Date(`${date}T12:00:00Z`);
const timeLabel = (time: string) => clock.format(new Date(`2000-01-01T${time}:00Z`));
const href = (day: string) => `/?section=calendar&day=${day}`;

function occursOn(event: CalendarEvent, date: string) {
  if (event.kind === "event") return event.date === date;
  return birthdayInYear(event.date, Number(date.slice(0, 4))) === date;
}

function EventFields({ day, event, kind = event?.kind ?? "event" }: {
  day: string; event?: CalendarEvent; kind?: CalendarEvent["kind"];
}) {
  const birthday = kind === "birthday";
  const monthDay = event?.kind === "birthday" ? event.date : day.slice(5);
  return <>
    <input type="hidden" name="kind" value={kind} />
    <label>Name<input name="title" defaultValue={event?.title} required maxLength={80}
      placeholder={birthday ? "e.g. Mom’s birthday" : "e.g. Family dinner"} /></label>
    {birthday ? <>
      <label>Month<select name="birthdayMonth" defaultValue={Number(monthDay.slice(0, 2))}>
        {Array.from({ length: 12 }, (_, index) => <option key={index} value={index + 1}>
          {new Intl.DateTimeFormat("en-US", { month: "long", timeZone: "UTC" }).format(new Date(Date.UTC(2000, index, 1)))}
        </option>)}
      </select></label>
      <label>Day<input type="number" name="birthdayDay" defaultValue={Number(monthDay.slice(3))} min={1} max={31} required /></label>
    </> : <>
      <label>Date<input type="date" name="date" defaultValue={event?.kind === "event" ? event.date : day} required /></label>
      <label>Time<input type="time" name="time" defaultValue={event?.time} /></label>
    </>}
    <label>Note<input name="note" defaultValue={event?.note} maxLength={100} placeholder="Optional" /></label>
  </>;
}

export function CalendarBoard({ window, today, events, schedule, people, memberId }: {
  window: ReturnType<typeof calendarWindow>;
  today: string;
  events: CalendarEvent[];
  schedule: ScheduleEntry[];
  people: { id: string; name: string }[];
  memberId: string;
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
  const birthdays = events.filter((event) => event.kind === "birthday")
    .map((event) => ({ ...event, nextDate: nextBirthday(event.date, today) }))
    .sort((a, b) => a.nextDate.localeCompare(b.nextDate));
  const nameOf = (id: string) => people.find((person) => person.id === id)?.name ?? "Former member";

  return <section className="household-calendar" aria-label="Household calendar">
    <div className="section-head calendar-agenda-head" id="day-agenda">
      <div><h2>{day === today ? "Today" : "Day agenda"}</h2><p>{dayLabel.format(asDate(day))}</p></div>
      <nav className="calendar-controls" aria-label="Agenda navigation">
        {day !== today && <Link className="button secondary" href={`${href(today)}#day-agenda`}>Today</Link>}
        <a className="button secondary" href="#calendar-month">Browse month</a>
      </nav>
      <details className="quick-form" id="calendar-add" key={day}>
        <summary><Plus size={17} /> Add</summary>
        <CalendarAdd
          event={<ActionForm action={updateBoard} intent="calendar-add" className="entry-form" feedback>
            <EventFields day={day} /><Submit>Save event</Submit>
          </ActionForm>}
          birthday={<ActionForm action={updateBoard} intent="calendar-add" className="entry-form" feedback>
            <EventFields day={day} kind="birthday" /><Submit>Save birthday</Submit>
          </ActionForm>}
          availability={<ActionForm action={updateBoard} intent="schedule-add" className="entry-form" feedback>
            <ScheduleFields today={day} /><Submit>Save availability</Submit>
          </ActionForm>}
        />
      </details>
    </div>
    <div className="lane calendar-agenda">
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
              <CalendarAdd initialChoice={event.kind}
                event={<ActionForm action={updateBoard} intent="calendar-edit" id={event.id} className="entry-form" feedback>
                  <EventFields day={day} event={event} kind="event" /><Submit variant="secondary">Save event</Submit>
                </ActionForm>}
                birthday={<ActionForm action={updateBoard} intent="calendar-edit" id={event.id} className="entry-form" feedback>
                  <EventFields day={day} event={event} kind="birthday" /><Submit variant="secondary">Save birthday</Submit>
                </ActionForm>}
              />
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
            {entry.member_id === memberId && <div className="item-actions">
              {entry.repeat_on?.length ? <a className="button plain" href={`#weekly-${entry.id}`}>Manage weekly schedule</a>
                : <details className="edit-form">
                  <summary>Edit</summary>
                  <ActionForm action={updateBoard} intent="schedule-edit" id={entry.id} className="entry-form" feedback>
                    <ScheduleFields today={day} entry={entry} /><Submit variant="secondary">Save changes</Submit>
                  </ActionForm>
                </details>}
            </div>}
          </li>;
        })}
      </ul>
      {selected?.events.some((event) => event.kind === "birthday") && <div className="birthday-note"><Cake size={15} /> Birthdays repeat every year.</div>}
    </div>
    <div className="lane calendar-card" id="calendar-month">
      <nav className="calendar-controls" aria-label="Calendar month">
        <Link className="button secondary" href={href(previous)} aria-label="Previous month"><ChevronLeft size={18} /></Link>
        <h2>{monthLabel.format(asDate(monthStart))}</h2>
        <Link className="button secondary" href={href(next)} aria-label="Next month"><ChevronRight size={18} /></Link>
      </nav>
      <div className="calendar-grid">
        {weekdays.map((name) => <span className="calendar-weekday" key={name}>{name}</span>)}
        {days.map(({ date, events, availability }) => {
          const statuses = [...new Map(availability.map(({ member_id, status }) => [
            `${member_id}-${status}`, { name: nameOf(member_id), status, label: status === "home" ? "Home" : "Away" },
          ])).entries()];
          const statusLabels = statuses.map(([, { name, label }]) => `${name} ${label}`);
          return <Link key={date} href={`${href(date)}#day-agenda`}
            className={`calendar-day ${date.slice(0, 7) !== day.slice(0, 7) ? "outside-month" : ""}`}
            aria-current={date === day ? "date" : undefined}
            aria-label={[dayLabel.format(asDate(date)), `${events.length} calendar entries`, ...statusLabels].join(", ")}>
            <span className="calendar-date">{Number(date.slice(8))}</span>
            {events.length > 0 && <span className={`calendar-marker ${events[0].kind}`}>{events[0].title}</span>}
            {statuses.map(([key, { name, status, label }]) => <span key={key} className={`calendar-availability ${status}`}>
              <span>{name}</span><span>{label}</span>
            </span>)}
            {events.length > 1 && <small className="calendar-extra">+{events.length - 1}</small>}
          </Link>;
        })}
      </div>
    </div>
    {birthdays.length > 0 && <div className="lane calendar-agenda">
      <div className="lane-heading"><span className="lane-icon buy"><Cake size={18} /></span><h3>Birthdays</h3></div>
      <ul className="items">
        {birthdays.map((birthday) => <li className="item" key={birthday.id}>
          <Link className="birthday-link item-title" href={`${href(birthday.nextDate)}#day-agenda`}>
            <strong>{birthday.title}</strong><small>{birthdayLabel.format(asDate(birthday.nextDate))}</small>
          </Link>
        </li>)}
      </ul>
    </div>}
  </section>;
}
