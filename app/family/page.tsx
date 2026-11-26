import Link from "next/link";
import { redirect } from "next/navigation";
import { getConfig } from "../../lib/config";
import { currentMember, memberInvite } from "../../lib/session";
import { Brand } from "../board";
import { ShareLink } from "./share-link";

export default async function FamilyLinks() {
  const viewer = await currentMember();
  const config = getConfig();
  if (!viewer?.manager || !config) redirect("/");

  return <main className="auth-page"><div className="auth-card family-card">
    <Brand />
    <h1>Family links</h1>
    <p>Send each person their own link. They can tap it to open the board and stay signed in on their phone.</p>
    <ul className="share-list">
      {config.members.filter((person) => person.id !== viewer.id).map((person) =>
        <ShareLink key={person.id} name={person.name} token={memberInvite(person.id, config.secret)} />)}
    </ul>
    <p className="share-note">Anyone with a link can use that profile. Send links privately.</p>
    <Link className="button primary" href="/">Back to the board</Link>
  </div></main>;
}
