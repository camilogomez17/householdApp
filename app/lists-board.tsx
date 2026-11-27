import { Check, ClipboardList, Plus } from "lucide-react";
import type { Checklist, ChecklistItem } from "../lib/data";
import { updateBoard } from "./actions";
import { ActionForm, Submit } from "./forms";

function ListItem({ listId, item }: { listId: string; item: ChecklistItem }) {
  return <li className="item">
    <div className="checklist-row">
      <ActionForm action={updateBoard} intent="list-item-check" id={listId}>
        <input type="hidden" name="itemId" value={item.id} />
        <input type="hidden" name="checked" value={item.checked ? "no" : "yes"} />
        <button type="submit" className="checklist-toggle" aria-pressed={item.checked} aria-label={item.label}>
          {item.checked && <Check size={15} />}
        </button>
      </ActionForm>
      <span className={item.checked ? "checked-label" : undefined}>{item.label}</span>
    </div>
    <div className="item-actions">
      <details className="edit-form">
        <summary>Edit</summary>
        <ActionForm action={updateBoard} intent="list-item-edit" id={listId} className="entry-form" feedback>
          <input type="hidden" name="itemId" value={item.id} />
          <label>Item<input name="label" defaultValue={item.label} maxLength={80} required /></label>
          <Submit variant="secondary">Save changes</Submit>
        </ActionForm>
      </details>
      <ActionForm action={updateBoard} intent="list-item-remove" id={listId}>
        <input type="hidden" name="itemId" value={item.id} />
        <Submit variant="danger">Remove</Submit>
      </ActionForm>
    </div>
  </li>;
}

export function ListsBoard({ lists }: { lists: Checklist[] }) {
  return <>
    <div className="section-head">
      <div><h2>Shared checklists</h2></div>
      <details className="quick-form">
        <summary><Plus size={17} /> New list</summary>
        <ActionForm action={updateBoard} intent="list-add" className="entry-form" feedback>
          <label>List name<input name="title" placeholder="e.g. Weekend errands" maxLength={80} required /></label>
          <Submit>Create list</Submit>
        </ActionForm>
      </details>
    </div>
    {lists.length === 0 && <p className="empty schedule-empty">No lists yet. Create one for errands, packing, or anything you need to check off together.</p>}
    <div className="checklists">
      {lists.map((list) => <section className="lane" key={list.id}>
        <div className="lane-heading"><span className="lane-icon maintain"><ClipboardList size={18} /></span>
          <h3>{list.title}</h3><span className="count">{list.items.filter((item) => item.checked).length}/{list.items.length}</span>
        </div>
        <div className="checklist-entry">
          <ActionForm action={updateBoard} intent="list-item-add" id={list.id} className="entry-form checklist-add">
            <label>New item<input name="label" maxLength={80} required /></label>
            <Submit variant="secondary">Add item</Submit>
          </ActionForm>
          <div className="item-actions">
            <details className="edit-form">
              <summary>Rename list</summary>
              <ActionForm action={updateBoard} intent="list-rename" id={list.id} className="entry-form" feedback>
                <label>List name<input name="title" defaultValue={list.title} maxLength={80} required /></label>
                <Submit variant="secondary">Save name</Submit>
              </ActionForm>
            </details>
            {list.items.length === 0 && <ActionForm action={updateBoard} intent="list-remove" id={list.id}>
              <Submit variant="danger">Remove empty list</Submit>
            </ActionForm>}
          </div>
        </div>
        <ul className="items">{list.items.map((item) => <ListItem key={item.id} listId={list.id} item={item} />)}</ul>
      </section>)}
    </div>
  </>;
}
