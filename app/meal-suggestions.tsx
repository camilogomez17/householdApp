"use client";

import { useId, useState } from "react";
import { mealCatalog, normalizeMeal, type Recipe } from "../lib/meal-catalog";
import { matchRecipe } from "../lib/ingredient-substitutions";
import type { Grocery, MealSlot } from "../lib/data";

function combinations(stock: Grocery[], size: number, offset: number, limit: number) {
  const result: Grocery[][] = [];
  let skipped = 0;
  function visit(start: number, items: Grocery[]) {
    if (result.length >= limit) return;
    if (items.length === size) {
      if (skipped < offset) skipped++;
      else result.push(items);
      return;
    }
    for (let i = start; i <= stock.length - (size - items.length); i++) {
      visit(i + 1, [...items, stock[i]]);
      if (result.length >= limit) break;
    }
  }
  visit(0, []);
  return result;
}

export function MealSuggestions({ stock, slot, catalog }: { stock: Grocery[]; slot: MealSlot; catalog: Recipe[] }) {
  const listId = useId();
  const [selected, setSelected] = useState<string[]>([]);
  const [title, setTitle] = useState("");
  const [size, setSize] = useState(2);
  const [page, setPage] = useState(0);
  const ordered = [...stock].sort((a, b) => a.name.localeCompare(b.name) || a.id.localeCompare(b.id));
  const count = Math.min(size, ordered.length);
  const pageSize = 20;
  const suggestions = count ? combinations(ordered, count, page * pageSize, pageSize + 1).map((items) => ({
    title: items.map((item) => item.name).join(" + ").slice(0, 80),
    ids: items.map((item) => item.id),
  })) : [];
  const recipes = [...new Map([...mealCatalog, ...catalog].filter(row => row.slot === slot).map(row => [normalizeMeal(row.title), row])).values()].map(recipe => {
    return {...recipe, ...matchRecipe(recipe, stock)};
  }).sort((a,b) => b.coverage - a.coverage || b.score - a.score || a.missing.length - b.missing.length);
  const choose = (ids: string[], name: string) => { setSelected(ids); setTitle(name); };
  const toggle = (id: string) => {
    const ids = selected.includes(id) ? selected.filter((value) => value !== id) : [...selected, id];
    setSelected(ids);
    setTitle(stock.filter((item) => ids.includes(item.id)).map((item) => item.name).join(" + ").slice(0, 80));
  };
  return <>
    <fieldset className="meal-ingredients"><legend>Recommended {slot} dishes</legend>
      {recipes.slice(0, 8).map(recipe => <button type="button" className="button secondary" key={recipe.title} onClick={() => choose(recipe.ids, recipe.title)}>
        {recipe.title} · {Math.round(recipe.coverage * 100)}% available · {Math.round(recipe.score * 100)}% compatibility{recipe.substitutions.length ? ` · Substitutes: ${recipe.substitutions.map(row => `${row.required} → ${row.actual}`).join(", ")}` : ""}{recipe.missing.length ? ` · Missing: ${recipe.missing.join(", ")}` : ""}
      </button>)}
    </fieldset>
    <fieldset className="meal-ingredients">
      <legend>Ingredient combinations</legend>
      <label>Number of ingredients<select value={count || 1} onChange={(event) => { setSize(Number(event.target.value)); setPage(0); }}>
        {Array.from({ length: Math.min(stock.length, 30) }, (_, i) => <option key={i + 1} value={i + 1}>{i + 1}</option>)}
      </select></label>
      {suggestions.slice(0, pageSize).map((suggestion) => <button key={suggestion.ids.join(",")} type="button" className="button secondary"
        aria-pressed={title === suggestion.title && selected.length === suggestion.ids.length && suggestion.ids.every((id) => selected.includes(id))}
        onClick={() => choose(suggestion.ids, suggestion.title)}>{suggestion.title}</button>)}
      {!suggestions.length && <p className="item-meta">No ingredients in stock.</p>}
      <div className="item-actions">
        <button type="button" className="button secondary" disabled={page === 0} onClick={() => setPage(page - 1)}>Previous</button>
        <button type="button" className="button secondary" disabled={suggestions.length <= pageSize} onClick={() => setPage(page + 1)}>Next</button>
      </div>
    </fieldset>
    <fieldset className="meal-ingredients">
      <legend>Build your own combination</legend>
      {stock.map((item) => <label key={item.id}>
        <input type="checkbox" name="ingredientId" value={item.id} checked={selected.includes(item.id)} onChange={() => toggle(item.id)} />
        <span>{item.name}{item.quantity && <small> · {item.quantity}</small>}</span>
      </label>)}
      {!stock.length && <p className="item-meta">No items in Maintain stock. Update groceries first.</p>}
    </fieldset>
    <label>Dish<input name="title" list={listId} value={title} onChange={(event) => { const value = event.target.value; const recipe = recipes.find(row => normalizeMeal(row.title) === normalizeMeal(value)); if (recipe) choose(recipe.ids, recipe.title); else setTitle(value); }} maxLength={80} required /></label>
    <datalist id={listId}>{recipes.map(recipe => <option key={recipe.title} value={recipe.title} />)}</datalist>
  </>;
}
