import { LockKeyhole } from "lucide-react";
import { demoMode, getConfig } from "../lib/config";
import { householdDate, loadBoard } from "../lib/data";
import { currentMember, memberInvite } from "../lib/session";
import { Board, Brand, Unavailable, type Section } from "./board";

export const dynamic = "force-dynamic";

export default async function Home({ searchParams }: { searchParams: Promise<{ section?: string }> }) {
  const config = getConfig();
  if (!config) return <Unavailable setup />;
  const member = await currentMember();
  if (!member) return <main className="auth-page">
    <div className="auth-card">
      <Brand />
      <span className="auth-symbol"><LockKeyhole size={26} /></span>
      <h1>Welcome home</h1>
      <p>Open your personal household link to see groceries, chores and schedules.</p>
      {demoMode && <div className="demo-access"><h2>Try a demo profile</h2>
        {config.members.map((person) => <a className="button secondary" key={person.id}
          href={`/join#${memberInvite(person.id, config.secret)}`}>{person.name}</a>)}
      </div>}
    </div>
  </main>;

  const { section } = await searchParams;
  const active: Section = section === "chores" || section === "schedule" ? section : "groceries";
  const data = await loadBoard(config.timeZone).catch((error: unknown) => {
    console.error("Couldn’t load household data", error instanceof Error ? error.name : "");
    return null;
  });
  if (!data) return <Unavailable />;

  const date = householdDate(config.timeZone);
  return <Board section={active} data={data} member={member}
    people={config.members.map(({ id, name }) => ({ id, name }))}
    date={date} currency={config.currency} timeZone={config.timeZone} demo={demoMode} />;
}
