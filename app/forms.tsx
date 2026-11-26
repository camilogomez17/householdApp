"use client";

import { useActionState, useEffect } from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import type { FormResult } from "./actions";

type Action = (previous: FormResult, form: FormData) => Promise<FormResult>;

export function ActionForm({
  action, intent, id, className, children, feedback = false,
}: {
  action: Action;
  intent?: string;
  id?: string;
  className?: string;
  children: ReactNode;
  feedback?: boolean;
}) {
  const [state, dispatch] = useActionState(action, {});
  return (
    <form action={dispatch} className={className}>
      {intent && <input type="hidden" name="intent" value={intent} />}
      {id && <input type="hidden" name="id" value={id} />}
      {children}
      {state.error && <p className="form-error" role="alert">{state.error}</p>}
      {feedback && state.saved && <p className="form-saved" role="status">Saved to the board.</p>}
    </form>
  );
}

export function Submit({
  children, variant = "primary",
}: { children: ReactNode; variant?: "primary" | "secondary" | "plain" | "danger" }) {
  const { pending } = useFormStatus();
  return <button type="submit" className={`button ${variant}`} disabled={pending}>
    {pending ? "Saving…" : children}
  </button>;
}

export function RefreshBoard() {
  const router = useRouter();
  useEffect(() => {
    const refresh = () => {
      if (document.visibilityState === "visible") router.refresh();
    };
    const timer = window.setInterval(refresh, 60_000);
    window.addEventListener("focus", refresh);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("focus", refresh);
    };
  }, [router]);
  return null;
}
