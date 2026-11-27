import { GroceryFields } from "./grocery-fields";
import type { GroceryCatalogItem } from "../lib/grocery-sections";
import { grocerySections, grocerySection } from "../lib/grocery-sections";
import { CalendarDays, Check, ChevronDown, ClipboardList, Clock3, CircleDollarSign, House, ListChecks,
  LogOut, Plus, ShoppingBasket, Trash2, Users, UtensilsCrossed, X } from "lucide-react";
import Link from "next/link";
import type { Chore, Grocery, ScheduleEntry, loadBoard } from "../lib/data";
import type { calendarWindow } from "../lib/calendar";
import { CalendarBoard } from "./calendar-board";
import { ScheduleFields, scheduleWeekdays } from "./schedule-fields";
import { ListsBoard } from "./lists-board";
import { MealsBoard } from "./meals-board";
import { logout, updateBoard } from "./actions";
import { ActionForm, RefreshBoard, Submit } from "./forms";

const sections = {
  groceries: { name: "Groceries", icon: ShoppingBasket, description: "Keep track of groceries, stock to maintain, and what needs to go." },
  chores: { name: "Chores", icon: ListChecks, description: "Assign work, check it off, and keep track of payouts." },
  calendar: { name: "Calendar", icon: CalendarDays, description: "See events, birthdays, and when everyone will be home or away." },
  meals: { name: "Meals", icon: UtensilsCrossed, description: "Plan meals together, vote, and coordinate cooking." },
  lists: { name: "Lists", icon: ClipboardList, description: "Keep shared checklists for errands, trips, and household tasks." },
};

const groceryGroups = {
  buy: { label: "To buy", icon: ShoppingBasket, empty: "Nothing to buy right now." },
  maintain: { label: "Maintain stock", icon: Check, empty: "No staples on this list yet." },
  remove: { label: "Remove", icon: Trash2, empty: "Nothing to clear out." },
};

const choreGroups = {
  open: { label: "To do", icon: ListChecks, empty: "No open chores." },
  done: { label: "Completed", icon: Check, empty: "No completed chores yet." },
  paid: { label: "Paid", icon: CircleDollarSign, empty: "No payouts recorded yet." },
};

export type Section = keyof typeof sections;
type Person = { id: string; name: string };
type Viewer = Person & { manager: boolean };
type Data = Awaited<ReturnType<typeof loadBoard>>;


export function Brand() {
  return <div className="brand">
    <div className="brand-icon"><House size={22} strokeWidth={2.2} /></div>
    <strong>Household</strong>
  </div>;
}

function Formatters(currency: string) {
  const date = new Intl.DateTimeFormat("en-US", { timeZone: "UTC", weekday: "short", month: "short", day: "numeric" });
  const time = new Intl.DateTimeFormat("en-US", { timeZone: "UTC", hour: "numeric", minute: "2-digit" });
  const money = new Intl.NumberFormat("en-US", { style: "currency", currency });
  return {
    date: (value: string) => date.format(new Date(`${value.slice(0, 10)}T12:00:00Z`)),
    time: (value: string) => time.format(new Date(`${value}Z`)),
    money: (cents: number) => money.format(cents / 100),
  };
}

const memberName = (people: Person[], id: string | null) =>
  id ? people.find((person) => person.id === id)?.name ?? "Former member" : "Unassigned";

function MemberSelect({ people, value = "", required = false }: { people: Person[]; value?: string; required?: boolean }) {
  return <select name="assignee" defaultValue={value} required={required}>
    <option value="" disabled={required}>{required ? "Choose a member" : "Unassigned"}</option>
    {people.map((person) => <option key={person.id} value={person.id}>{person.name}</option>)}
    {value && !people.some((person) => person.id === value) && <option value={value}>Former member</option>}
  </select>;
}

function QuickForm({ children, intent, title }: { children: React.ReactNode; intent: string; title: string }) {
  return <details className="quick-form">
    <summary><Plus size={17} /> {title}</summary>
    <ActionForm action={updateBoard} intent={intent} className="entry-form" feedback>
      {children}
      <Submit>Save entry</Submit>
    </ActionForm>
  </details>;
}

function EditForm({ id, intent, children, title = "Edit" }: {
  id: string; intent: string; children: React.ReactNode; title?: string;
}) {
  return <details className="edit-form">
    <summary>{title} <ChevronDown size={14} /></summary>
    <ActionForm id={id} action={updateBoard} intent={intent} className="entry-form" feedback>
      {children}
      <Submit variant="secondary">Save changes</Submit>
    </ActionForm>
  </details>;
}

function ItemAction({ id, intent, label, assignee, variant = "plain" }: {
  id: string; intent: string; label: string; assignee?: string; variant?: "plain" | "danger";
}) {
  return <ActionForm action={updateBoard} intent={intent} id={id}>
    {assignee && <input type="hidden" name="assignee" value={assignee} />}
    <Submit variant={variant}>{label}</Submit>
  </ActionForm>;
}

function GroceryBoard({ items, member, people, catalog }: { items: Grocery[]; member: Viewer; people: Person[]; catalog: GroceryCatalogItem[] }) {
  return <>
    <div className="section-head">
      <div><h2>Grocery lists</h2><p>Claim an item before shopping to avoid a double purchase.</p></div>
      <QuickForm intent="grocery-add" title="Add grocery"><GroceryFields catalog={catalog} /></QuickForm>
    </div>
    <div className="lanes">
      {(Object.keys(groceryGroups) as Grocery["status"][]).map((status) => {
        const group = groceryGroups[status];
        const rows = items.filter((item) => item.status === status);
        return <section className="lane" key={status}>
          <div className="lane-heading"><span className={`lane-icon ${status}`}><group.icon size={18} /></span>
            <h3>{group.label}</h3><span className="count">{rows.length}</span>
          </div>
          {grocerySections.map((section) => {
            const department = rows.filter((item) => grocerySection(item) === section).sort((a, b) => a.name.localeCompare(b.name));
            if (!department.length) return null;
            return <div key={section} className="grocery-department"><h4>{section}</h4><ul className="items">
            {department.map((item) => <li key={item.id} className="item">
              <div className="item-title"><strong>{item.name}</strong>
                {item.quantity && <small>{item.quantity}</small>}
              </div>
              {item.claimed_by && <span className="tag buy">Claimed by {memberName(people, item.claimed_by)}</span>}
              <div className="item-actions">
                {status === "buy" && (!item.claimed_by
                  ? <ItemAction id={item.id} intent="grocery-claim" label="Claim" />
                  : item.claimed_by === member.id && <ItemAction id={item.id} intent="grocery-release" label="Release" />)}
                {status === "remove" && <ItemAction id={item.id} intent="grocery-delete" label="Clear item" variant="danger" />}
                <EditForm id={item.id} intent="grocery-edit"><GroceryFields item={item} catalog={catalog} /></EditForm>
              </div>
            </li>)}
          </ul></div>;
          })}
          {!rows.length && <p className="empty">{group.empty}</p>}
        </section>;
      })}
    </div>
  </>;
}

function ChoreFields({ item, member, people, currency }: {
  item?: Chore; member: Viewer; people: Person[]; currency: string;
}) {
  return <>
    <label>Chore<input name="name" placeholder="e.g. Clean the kitchen" defaultValue={item?.name} maxLength={80} required /></label>
    {(member.manager || !item) && <label>Assign to<MemberSelect people={member.manager ? people : [member]}
      value={item?.assignee ?? ""} required={Boolean(item && item.status !== "open")} /></label>}
    <label>Due date<input name="due" type="date" defaultValue={item?.due_on ?? ""} /></label>
    {member.manager ? <label>{item?.status === "paid" ? "Amount paid" : "Reward"} ({currency})
      <input name="reward" type="number" min={item?.status === "paid" ? "0.01" : "0"} max="10000"
        step="0.01" placeholder="0.00" defaultValue={item ? (item.reward_cents / 100).toFixed(2) : undefined}
        required={item?.status === "paid"} />
    </label> : !item && <input type="hidden" name="reward" value="0" />}
  </>;
}

function ChoreBoard({ items, member, people, currency }: { items: Chore[]; member: Viewer; people: Person[]; currency: string }) {
  const format = Formatters(currency);
  return <>
    <div className="section-head">
      <div><h2>Chore board</h2><p>Record payouts after the money has been exchanged.</p></div>
      <QuickForm intent="chore-add" title="Add chore">
        <ChoreFields member={member} people={people} currency={currency} />
      </QuickForm>
    </div>
    <div className="lanes">
      {(Object.keys(choreGroups) as Chore["status"][]).map((status) => {
        const group = choreGroups[status];
        const rows = items.filter((item) => item.status === status);
        return <section key={status} className="lane">
          <div className="lane-heading"><span className={`lane-icon ${status}`}><group.icon size={18} /></span>
            <h3>{group.label}</h3><span className="count">{rows.length}</span>
          </div>
          <ul className="items">{rows.map((item) => <li key={item.id} className="item">
            <div className="item-title"><strong>{item.name}</strong><span className="tag maintain">
              {item.reward_cents ? format.money(item.reward_cents) : "Unpaid chore"}
            </span></div>
            <p className="item-meta">{memberName(people, item.assignee)}{item.due_on && ` · Due ${format.date(item.due_on)}`}</p>
            {item.paid_on && <p className="item-meta">Paid {format.date(item.paid_on)} by {memberName(people, item.paid_by)}</p>}
            <div className="item-actions">
              {(member.manager || (item.assignee === member.id && status !== "paid")) &&
                <EditForm id={item.id} intent="chore-edit">
                  <ChoreFields item={item} member={member} people={people} currency={currency} />
                </EditForm>}
              {status === "open" && !item.assignee && !member.manager && <ItemAction id={item.id} intent="chore-assign" label="Assign to me" assignee={member.id} />}
              {status === "open" && item.assignee && (member.manager || item.assignee === member.id) && <ItemAction id={item.id} intent="chore-done" label="Mark done" />}
              {status === "open" && member.manager && <ItemAction id={item.id} intent="chore-delete" label="Remove" variant="danger" />}
              {status === "done" && (member.manager || item.assignee === member.id) && <ItemAction id={item.id} intent="chore-reopen" label="Reopen" />}
              {status === "done" && member.manager && item.reward_cents > 0 && <ItemAction id={item.id} intent="chore-paid" label="Record payment" />}
            </div>
          </li>)}</ul>
          {!rows.length && <p className="empty">{group.empty}</p>}
        </section>;
      })}
    </div>
  </>;
}

function ScheduleRow({ entry, member, people, today }: {
  entry: ScheduleEntry; member: Viewer; people: Person[]; today: string;
}) {
  const date = Formatters("USD");
  const endDay = entry.ends_at.slice(0, 10) !== entry.starts_at.slice(0, 10);
  return <li className="item schedule-item">
    <div className="item-title"><strong>{memberName(people, entry.member_id)}</strong>
      <span className={`tag ${entry.status === "home" ? "maintain" : "buy"}`}>{entry.status === "home" ? "Home" : "Away"}</span>
    </div>
    <p className="item-meta"><Clock3 size={15} />{date.time(entry.starts_at)} – {endDay && `${date.date(entry.ends_at)}, `}{date.time(entry.ends_at)}</p>
    {entry.note && <p className="item-meta">{entry.note}</p>}
    {!entry.repeat_on?.length && entry.member_id === member.id && <div className="item-actions">
      <EditForm id={entry.id} intent="schedule-edit"><ScheduleFields today={today} entry={entry} /></EditForm>
      <ItemAction id={entry.id} intent="schedule-delete" label="Remove" variant="danger" />
    </div>}
  </li>;
}

function ScheduleBoard({ items, weekly, past, people, member, timeZone, today }: {
  items: ScheduleEntry[]; weekly: ScheduleEntry[]; past: ScheduleEntry[]; people: Person[]; member: Viewer; timeZone: string; today: string;
}) {
  const date = Formatters("USD");
  const days = Map.groupBy(items.filter((item) => !item.repeat_on?.length), (item) => item.starts_at.slice(0, 10));
  return <>
    <div className="section-head">
      <div><h2 id="availability">Home and away</h2><p>Schedule times use {timeZone.replaceAll("_", " ")}.</p></div>
      <a className="button secondary" href="#calendar-add">Add from the calendar</a>
    </div>
    {weekly.length > 0 && <section className="lane weekly-schedule">
      <div className="lane-heading"><span className="lane-icon maintain"><CalendarDays size={18} /></span><h3>Weekly schedules</h3></div>
      <ul className="items">{weekly.map((entry) => <li className="item schedule-item" key={entry.id} id={`weekly-${entry.id}`}>
        <div className="item-title"><strong>{memberName(people, entry.member_id)}{entry.note && ` · ${entry.note}`}</strong>
          <span className={`tag ${entry.status === "home" ? "maintain" : "buy"}`}>{entry.status === "home" ? "Home" : "Away"}</span>
        </div>
        <p className="item-meta">{scheduleWeekdays.filter(({ id }) => entry.repeat_on?.includes(id)).map(({ label }) => label).join(", ")} · {date.time(entry.starts_at)} – {date.time(entry.ends_at)}
          {entry.ends_at.slice(0, 10) !== entry.starts_at.slice(0, 10) && " next day"}
        </p>
        {entry.starts_at.slice(0, 10) > today && <p className="item-meta">Starts {date.date(entry.starts_at)}</p>}
        {entry.member_id === member.id && <div className="item-actions">
          <EditForm id={entry.id} intent="schedule-edit" title="Edit weekly schedule"><ScheduleFields today={today} entry={entry} /></EditForm>
          <ItemAction id={entry.id} intent="schedule-delete" label="Stop repeating" variant="danger" />
        </div>}
      </li>)}</ul>
    </section>}
    {!days.size && !weekly.length && <p className="empty schedule-empty">No upcoming schedules. Add when you’ll be home or away.</p>}
    {days.size > 0 && <h3 className="one-time-heading">One-time schedules</h3>}
    <div className="schedule-days">
      {[...days].map(([day, entries]) => <section className="lane schedule-day" key={day}>
        <div className="lane-heading"><span className="lane-icon maintain"><CalendarDays size={18} /></span><h3>{date.date(day)}</h3></div>
        <ul className="items">{entries.map((entry) =>
          <ScheduleRow key={`${entry.id}-${entry.starts_at}`} entry={entry} member={member} people={people} today={today} />)}</ul>
      </section>)}
    </div>
    {past.length > 0 && <details className="lane past-schedule">
      <summary className="lane-heading">Your past schedules <ChevronDown size={16} /></summary>
      <div className="schedule-days">
        {[...Map.groupBy(past, (entry) => entry.starts_at.slice(0, 10))].map(([day, entries]) =>
          <section key={day}>
            <h3 className="lane-heading">{date.date(day)}</h3>
            <ul className="items">{entries.map((entry) =>
              <ScheduleRow key={entry.id} entry={entry} member={member} people={people} today={today} />)}</ul>
          </section>)}
      </div>
    </details>}
  </>;
}

export function Board({ section, data, member, people, currency, timeZone, date, calendar, demo }: {
  section: Section; data: Data; member: Viewer; people: Person[]; currency: string; timeZone: string; date: string; calendar: ReturnType<typeof calendarWindow>; demo: boolean;
}) {
  const totals = {
    groceries: [data.groceries.filter((item) => item.status === "buy").length, "Groceries to buy"],
    chores: [data.chores.filter((item) => item.status === "open").length, "Open chores"],
    calendar: [data.schedule.filter((item) => item.starts_at.slice(0, 10) <= date && item.ends_at.slice(0, 10) >= date).length, "Schedule entries today"],
  };
  const SectionIcon = sections[section].icon;
  const today = new Intl.DateTimeFormat("en-US", { dateStyle: "full", timeZone: "UTC" }).format(new Date(`${date}T12:00:00Z`));
  return <div className="app-shell">
    <RefreshBoard />
    <aside className="sidebar">
      <Brand />
      <nav aria-label="Household sections">
        {(Object.keys(sections) as Section[]).map((key) => {
          const { icon: Icon, name } = sections[key];
          return <Link key={key} href={key === "groceries" ? "/" : `/?section=${key}`}
            aria-current={section === key ? "page" : undefined}><Icon size={19} />{name}</Link>;
        })}
        {member.manager && <Link className="family-link" href="/family"><Users size={19} />Family links</Link>}
      </nav>
      <div className="profile">
        <span className="avatar" aria-hidden="true">{member.name.slice(0, 1).toUpperCase()}</span>
        <div><strong>{member.name}</strong><small>{member.manager ? "Manager" : "Member"}</small></div>
        <form action={logout}><button title="Sign out" aria-label="Sign out"><LogOut size={19} /></button></form>
      </div>
    </aside>
    <main className="workspace">
      <header className="topbar"><p>{today}</p><span className="privacy-label">{demo ? "Local demo" : "Private household"}</span></header>
      <div className="workspace-content">
        <header className="welcome">
          <div><h1>{sections[section].name}</h1><p>{sections[section].description}</p></div>
          <div className="welcome-icon" aria-hidden="true"><SectionIcon /></div>
        </header>
        <div className="overview">
          {(Object.keys(totals) as (keyof typeof totals)[]).map((key) => {
            const Icon = sections[key].icon;
            return <Link className="stat" key={key} href={key === "groceries" ? "/" : `/?section=${key}`}>
              <span className={`stat-icon ${key}`}><Icon size={21} /></span>
              <span><strong>{totals[key][0]}</strong><small>{totals[key][1]}</small></span>
            </Link>;
          })}
        </div>
        {section === "groceries" && <GroceryBoard catalog={[...data.groceries.map(item => ({name: item.name, section: grocerySection(item)})), ...data.groceryCatalog]} items={data.groceries} member={member} people={people} />}
        {section === "chores" && <ChoreBoard items={data.chores} member={member} people={people} currency={currency} />}
        {section === "calendar" && <>
          <CalendarBoard window={calendar} today={date} events={data.events} schedule={data.calendarSchedule} people={people} memberId={member.id} />
          <ScheduleBoard items={data.schedule} weekly={data.weeklySchedule} past={data.pastSchedule.filter((entry) => entry.member_id === member.id)} member={member} people={people} timeZone={timeZone} today={date} />
        </>}
        {section === "lists" && <ListsBoard lists={data.lists} />}
        {section === "meals" && <MealsBoard catalog={data.mealCatalog} meals={data.meals} groceries={data.groceries} people={people} member={member} today={date} />}
      </div>
    </main>
  </div>;
}

export function Unavailable({ setup }: { setup?: boolean }) {
  return <main className="auth-page">
    <div className="auth-card"><Brand /><span className="auth-symbol"><X size={26} /></span>
      <h1>{setup ? "Household setup required" : "Board unavailable"}</h1>
      <p>{setup ? "Private household storage is still being set up." : "The board couldn’t connect to storage. Try again in a moment."}</p>
      {!setup && <Link className="button secondary" href="/">Try again</Link>}
    </div>
  </main>;
}
