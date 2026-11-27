"use client";

import { useState } from "react";
import type { Grocery } from "../lib/data";

const recipes: { title: string; groups: RegExp[] }[] = [
  { title: "Chicken and rice", groups: [/\bchicken\b/i, /\brice\b/i] },
  { title: "Egg fried rice", groups: [/\beggs?\b/i, /\brice\b/i, /\bonions?\b/i] },
  { title: "Chicken and onion skillet", groups: [/\bchicken\b/i, /\bonions?\b/i] },
  { title: "Potato and egg hash", groups: [/\bpotato(?:es)?\b/i, /\beggs?\b/i] },
  { title: "Tomato pasta", groups: [/\b(pasta|spaghetti|penne)\b/i, /\btomato(?:es)?\b/i] },
  { title: "Rice and beans", groups: [/\brice\b/i, /\bbeans?\b/i] },
  { title: "Cheese omelet", groups: [/\beggs?\b/i, /\bcheese\b/i] },
  { title: "Tuna sandwich", groups: [/\btuna\b/i, /\bbread\b/i] },
  { title: "Oatmeal with banana", groups: [/\b(oats|oatmeal)\b/i, /\bbananas?\b/i] },
  { title: "Tomato and cucumber salad", groups: [/\btomato(?:es)?\b/i, /\bcucumbers?\b/i] },
  { title: "Chicken and potato tray bake", groups: [/\bchicken\b/i, /\bpotato(?:es)?\b/i] },
  { title: "Pasta with cheese", groups: [/\b(pasta|spaghetti|penne)\b/i, /\bcheese\b/i] },
];

export function MealSuggestions({ stock }: { stock: Grocery[] }) {
  const [selected, setSelected] = useState<string[]>([]);
  const [title, setTitle] = useState("");
  const suggestions = recipes.flatMap((recipe) => {
    const items = recipe.groups.map((group) => stock.find((item) => group.test(item.name)));
    if (!items.every((item): item is Grocery => Boolean(item))) return [];
    return [{ title: recipe.title, ids: items.map((item) => item.id) }];
  });
  const choose = (ids: string[], name: string) => { setSelected(ids); setTitle(name); };
  const toggle = (id: string) => {
    const ids = selected.includes(id) ? selected.filter((value) => value !== id) : [...selected, id];
    setSelected(ids);
    setTitle(stock.filter((item) => ids.includes(item.id)).map((item) => item.name).join(" + ").slice(0, 80));
  };
  return <>
    <fieldset className="meal-ingredients">
      <legend>Suggested dishes from stock</legend>
      {suggestions.map((suggestion) => <button key={suggestion.title} type="button" className="button secondary"
        aria-pressed={title === suggestion.title && selected.length === suggestion.ids.length && suggestion.ids.every((id) => selected.includes(id))}
        onClick={() => choose(suggestion.ids, suggestion.title)}>{suggestion.title}</button>)}
      {!suggestions.length && <p className="item-meta">No matching recipe yet. Combine ingredients below to create a dish.</p>}
    </fieldset>
    <fieldset className="meal-ingredients">
      <legend>Build your own combination</legend>
      {stock.map((item) => <label key={item.id}>
        <input type="checkbox" name="ingredientId" value={item.id} checked={selected.includes(item.id)} onChange={() => toggle(item.id)} />
        <span>{item.name}{item.quantity && <small> · {item.quantity}</small>}</span>
      </label>)}
      {!stock.length && <p className="item-meta">No items in Maintain stock. Update groceries first.</p>}
    </fieldset>
    <label>Dish<input name="title" value={title} onChange={(event) => setTitle(event.target.value)} maxLength={80} required /></label>
  </>;
}
