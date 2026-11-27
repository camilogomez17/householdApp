import Link from "next/link";
import { redirect } from "next/navigation";
import { getConfig } from "../../lib/config";
import { accessCode, currentMember, memberInvite } from "../../lib/session";
import { Brand } from "../board";
import { ShareLink } from "./share-link";

export default async function FamilyLinks() {
  const viewer = await currentMember();
  const config = getConfig();
  if (!viewer?.manager || !config) redirect("/");

  return <main className="auth-page"><div className="auth-card family-card">
    <Brand />
    <h1>Family links</h1>
    <p>Send each person their own code or link. Either one signs them in on their phone.</p>
    <div><strong>Your access code</strong><code className="family-code">{accessCode(memberInvite(viewer.id, config.secret))}</code></div>
    <ul className="share-list">
      {config.members.filter((person) => person.id !== viewer.id).map((person) => {
        const token = memberInvite(person.id, config.secret);
        return <ShareLink key={person.id} name={person.name} token={token} code={accessCode(token)} />;
      })}
    </ul>
    <p className="share-note">Anyone with a code or link can use that profile. Share them privately.</p>
    <Link className="button primary" href="/">Back to the board</Link>
  </div></main>;
}
