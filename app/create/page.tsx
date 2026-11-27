import { Brand } from "../board";
import { Registration } from "./registration";
export default function CreatePage() {
  return <main className="auth-page"><div className="auth-card"><Brand/><h1>Create a household</h1><Registration/><a href="/">Back to sign in</a></div></main>;
}
