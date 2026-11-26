import { Brand } from "../board";
import { JoinLink } from "./join-link";

export default function JoinPage() {
  return <main className="auth-page"><div className="auth-card">
    <Brand />
    <h1>Welcome home</h1>
    <JoinLink />
  </div></main>;
}
