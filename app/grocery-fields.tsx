"use client";
import { useId, useState } from "react";
import type { Grocery } from "../lib/data";
import { groceryCatalog, grocerySection, grocerySections, normalizeGroceryName, type GroceryCatalogItem, type GrocerySection } from "../lib/grocery-sections";

export function GroceryFields({ item, catalog }: { item?: Grocery; catalog: GroceryCatalogItem[] }) {
  const listId = useId();
  const [section, setSection] = useState<GrocerySection>(item ? grocerySection(item) : "Other");
  const dictionary = new Map([...groceryCatalog, ...catalog].map(entry => [normalizeGroceryName(entry.name), entry]));
  const entries = [...dictionary.values()].sort((a,b) => a.name.localeCompare(b.name));
  return <>
    <label>Item<input name="name" list={listId} placeholder="e.g. Oat milk" defaultValue={item?.name} maxLength={80} required onChange={event => {
      const name = event.currentTarget.value;
      setSection(dictionary.get(normalizeGroceryName(name))?.section ?? grocerySection({name}));
    }} /></label>
    <datalist id={listId}>{entries.map(entry => <option key={normalizeGroceryName(entry.name)} value={entry.name}>{entry.section}</option>)}</datalist>
    <label>Quantity or target<input name="quantity" placeholder="e.g. 2 cartons" defaultValue={item?.quantity} maxLength={40} /></label>
    <label>Department<select name="section" value={section} onChange={event => setSection(event.target.value as GrocerySection)}>
      {grocerySections.map(value => <option key={value}>{value}</option>)}
    </select></label>
    <label>List<select name="status" defaultValue={item?.status ?? "buy"}>
      <option value="buy">To buy</option><option value="maintain">Maintain stock</option><option value="remove">Remove</option>
    </select></label>
  </>;
}
