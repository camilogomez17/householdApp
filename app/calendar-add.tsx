"use client";

import { useState, type ReactNode } from "react";

const choices = [
  { key: "event", label: "Event" },
  { key: "birthday", label: "Birthday" },
  { key: "availability", label: "Home / Away" },
] as const;

type Choice = (typeof choices)[number]["key"];

export function CalendarAdd({ event, birthday, availability, initialChoice = "event" }: {
  event: ReactNode;
  birthday: ReactNode;
  availability?: ReactNode;
  initialChoice?: Choice;
}) {
  const [choice, setChoice] = useState<Choice>(initialChoice);
  const entryTypes = choices.filter(({ key }) => key !== "availability" || availability);
  return <div className="calendar-add-form">
    <div className="calendar-entry-types" role="group" aria-label="Entry type">
      {entryTypes.map(({ key, label }) => <button className="button secondary" key={key} type="button"
        aria-pressed={choice === key} onClick={() => setChoice(key)}>{label}</button>)}
    </div>
    <div hidden={choice !== "event"}>{event}</div>
    <div hidden={choice !== "birthday"}>{birthday}</div>
    {availability && <div hidden={choice !== "availability"}>{availability}</div>}
  </div>;
}
