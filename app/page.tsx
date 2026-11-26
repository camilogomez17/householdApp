import { LockKeyhole } from "lucide-react";
import { demoMode, getConfig } from "../lib/config";
import { loadBoard } from "../lib/data";
import { currentMember } from "../lib/session";
import { login } from "./actions";
import { Board, Brand, Unavailable, type Section } from "./board";
import { ActionForm, Submit } from "./forms";

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
      <p>Use your personal access key to sign in to the household board.</p>
      <ActionForm action={login} className="entry-form">
        <label>Access key<input name="key" type="password" autoComplete="current-password" maxLength={256} required /></label>
        <Submit>Sign in</Submit>
      </ActionForm>
      {demoMode && <div className="demo-access"><h2>Try a demo profile</h2>
        {config.members.map((person) => <ActionForm key={person.id} action={login}>
          <input type="hidden" name="key" value={person.key} /><Submit variant="secondary">{person.name}</Submit>
        </ActionForm>)}
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

  const [groceries, chores, schedule] = data;
  const date = new Intl.DateTimeFormat("en-CA", { timeZone: config.timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
  return <Board section={active} data={{ groceries, chores, schedule }} member={member}
    people={config.members.map(({ id, name }) => ({ id, name }))}
    date={date} currency={config.currency} timeZone={config.timeZone} demo={demoMode} />;
}
