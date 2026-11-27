"use client";

import { useState } from "react";

export function ShareLink({ name, token, code }: { name: string; token: string; code: string }) {
  const [notice, setNotice] = useState("");
  const [visibleLink, setVisibleLink] = useState("");

  async function share() {
    const url = new URL(`/join#${token}`, window.location.origin).href;
    if (navigator.share) {
      try {
        await navigator.share({ title: `Household link for ${name}`, url });
        return;
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setNotice("Link copied. Send it to this person.");
    } catch {
      setVisibleLink(url);
    }
  }

  return <li>
    <div className="share-row"><div><strong>{name}</strong><code className="family-code">{code}</code></div><button type="button" className="button secondary" onClick={share}>Share link</button></div>
    {notice && <p role="status">{notice}</p>}
    {visibleLink && <label className="share-fallback">Copy this link<input readOnly value={visibleLink} onFocus={(event) => event.currentTarget.select()} /></label>}
  </li>;
}
