import { LockKeyhole } from "lucide-react";
import { demoMode, getConfig } from "../lib/config";
import { householdDate, loadBoard } from "../lib/data";
import { calendarWindow } from "../lib/calendar";
import { currentMember, memberInvite } from "../lib/session";
import { Board, Brand, Unavailable, type Section } from "./board";
import { enterAccessCode } from "./actions";
import { ActionForm, Submit } from "./forms";

export const dynamic = "force-dynamic";

export default async function Home({ searchParams }: { searchParams: Promise<{ section?: string; day?: string }> }) {
  const config = getConfig();
  if (!config) return <Unavailable setup />;
  const member = await currentMember();
  if (!member) return <main className="auth-page">
    <div className="auth-card">
      <Brand />
      <span className="auth-symbol"><LockKeyhole size={26} /></span>
      <h1>Welcome home</h1>
      <p>Enter your personal code to open your household board.</p>
      <ActionForm action={enterAccessCode} className="entry-form">
        <label>Access code
          <input name="code" placeholder="XXXX-XXXX-XXXX" autoCapitalize="characters"
            autoComplete="off" spellCheck={false} maxLength={32} required />
        </label>
        <Submit>Open household board</Submit>
      </ActionForm>
      <p className="share-note">Your personal invite link also opens the board.</p>
      {demoMode && <div className="demo-access"><h2>Try a demo profile</h2>
        {config.members.map((person) => <a className="button secondary" key={person.id}
          href={`/join#${memberInvite(person.id, config.secret)}`}>{person.name}</a>)}
      </div>}
    </div>
  </main>;

  const { section, day } = await searchParams;
  const active: Section = section === "schedule" ? "calendar"
    : section === "chores" || section === "calendar" || section === "lists" || section === "meals" ? section : "groceries";
  const date = householdDate(config.timeZone);
  const calendar = calendarWindow(date, active === "calendar" && typeof day === "string" ? day : undefined);
  const data = await loadBoard(config.timeZone, active === "calendar" ? calendar : undefined).catch((error: unknown) => {
    console.error("Couldn’t load household data", error instanceof Error ? error.name : "");
    return null;
  });
  if (!data) return <Unavailable />;

  return <Board section={active} data={data} member={member}
    people={config.members.map(({ id, name }) => ({ id, name }))}
    date={date} calendar={calendar} currency={config.currency} timeZone={config.timeZone} demo={demoMode} />;
}
