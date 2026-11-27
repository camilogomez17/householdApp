"use client";
import { useState } from "react";
import type { Grocery } from "../lib/data";
import { groceryCatalog, grocerySection, grocerySections, normalizeGroceryName, type GroceryCatalogItem, type GrocerySection } from "../lib/grocery-sections";

export function GroceryFields({ item, catalog }: { item?: Grocery; catalog: GroceryCatalogItem[] }) {
  const [name, setName] = useState(item?.name ?? "");
  const [section, setSection] = useState<GrocerySection>(item ? grocerySection(item) : "Other");
  const [searching, setSearching] = useState(false);
  const [override, setOverride] = useState(false);
  const dictionary = new Map([...groceryCatalog, ...catalog].map(entry => [normalizeGroceryName(entry.name), entry]));
  const query = normalizeGroceryName(name);
  const exact = dictionary.get(query);
  const matches = [...dictionary.values()].filter(entry => query.split(" ").every(word => normalizeGroceryName(entry.name).includes(word)))
    .sort((a,b) => Number(!normalizeGroceryName(a.name).startsWith(query)) - Number(!normalizeGroceryName(b.name).startsWith(query)) || a.name.localeCompare(b.name)).slice(0, 12);
  const choose = (entry: GroceryCatalogItem) => {
    setName(entry.name); setSection(entry.section); setSearching(false); setOverride(false);
  };
  return <>
    <div className="grocery-search">
      <label>Search groceries<input name="name" placeholder="Search products, e.g. chicken" value={name} maxLength={80} required autoComplete="off"
        onFocus={() => setSearching(true)} onChange={event => {
          const value = event.currentTarget.value;
          setName(value); setSection(dictionary.get(normalizeGroceryName(value))?.section ?? grocerySection({name: value})); setSearching(true); setOverride(false);
        }} /></label>
      {searching && query && <div className="grocery-results" aria-label="Matching products">
        {matches.map(entry => <button key={normalizeGroceryName(entry.name)} type="button" className="grocery-result" onClick={() => choose(entry)}>
          <strong>{entry.name}</strong><small>{entry.section}</small>
        </button>)}
        {!exact && <button type="button" className="grocery-result" onClick={() => { setSearching(false); setOverride(true); }}>
          <strong>Add “{name.trim()}” as a custom product</strong><small>Choose its department once</small>
        </button>}
      </div>}
      <input type="hidden" name="section" value={section} />
      {name.trim() && <div className="grocery-category"><span>Department: {section}</span>
        <button type="button" className="button plain" onClick={() => setOverride(!override)}>{override ? "Hide" : "Change"}</button>
      </div>}
      {override && <label>Department<select value={section} onChange={event => setSection(event.target.value as GrocerySection)}>
        {grocerySections.map(value => <option key={value}>{value}</option>)}
      </select></label>}
    </div>
    <label>Quantity or target<input name="quantity" placeholder="e.g. 2 cartons" defaultValue={item?.quantity} maxLength={40} /></label>
    <label>List<select name="status" defaultValue={item?.status ?? "buy"}>
      <option value="buy">To buy</option><option value="maintain">Maintain stock</option><option value="remove">Remove</option>
    </select></label>
  </>;
}
