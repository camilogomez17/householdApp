"use client";

import { useEffect, useRef, useState } from "react";
import { acceptInvite } from "../actions";

export function JoinLink() {
  const started = useRef(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const token = window.location.hash.slice(1);
    void acceptInvite(token).then((result) => {
      if (result.saved) window.location.replace("/");
      else setError(result.error || "This link couldn’t open the board.");
    }).catch(() => setError("Couldn’t connect. Open the link again to retry."));
  }, []);

  return <p role={error ? "alert" : "status"}>{error || "Opening your household board…"}</p>;
}
