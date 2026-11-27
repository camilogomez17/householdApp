"use client";
import { useActionState } from "react";
import { register } from "./actions";
export function Registration() {
  const [state, action, pending] = useActionState(register, {});
  if (state.code) return <div><p>Save your private access code. It will not be shown again.</p><code style={{overflowWrap:"anywhere"}}>{state.code}</code><p><a className="button primary" href="/">Open household board</a></p></div>;
  return <form action={action} className="entry-form"><label>Household name<input name="name" required maxLength={40}/></label><label>Your name<input name="owner" required maxLength={40}/></label>{state.error && <p role="alert">{state.error}</p>}<button className="button primary" disabled={pending}>Create household</button></form>;
}
