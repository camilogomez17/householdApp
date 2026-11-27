import Link from "next/link";
import { redirect } from "next/navigation";
import { currentMember } from "../../lib/session";
import { Brand } from "../board";
export default async function FamilyLinks() {
  const viewer = await currentMember();
  if (!viewer?.manager) redirect("/");
  return <main className="auth-page"><div className="auth-card family-card"><Brand/><h1>Family links</h1><p>Personal access codes are private. New member invitations are not yet available.</p><Link className="button primary" href="/">Back to the board</Link></div></main>;
}
