import type { Recipe } from "../lib/meal-catalog";
import { grocerySection } from "../lib/grocery-sections";
import type { ReactNode } from "react";
import type { Grocery, MealPlan, MealSlot } from "../lib/data";
import { shiftDate } from "../lib/data";
import { updateBoard } from "./actions";
import { ActionForm, Submit } from "./forms";
import { MealSuggestions } from "./meal-suggestions";

type Person = { id: string; name: string };
type Member = Person & { manager: boolean };
const slots: MealSlot[] = ["breakfast", "lunch", "dinner"];

function Action({ intent, id, proposalId, children }: {
  intent: string; id: string; proposalId?: string; children: ReactNode;
}) {
  return <ActionForm action={updateBoard} intent={intent} id={id}>
    {proposalId && <input type="hidden" name="proposalId" value={proposalId} />}
    <Submit variant="plain">{children}</Submit>
  </ActionForm>;
}

export function MealsBoard({ meals, groceries, people, member, today, catalog }: {
  catalog: Recipe[]; meals: MealPlan[]; groceries: Grocery[]; people: Person[]; member: Member; today: string;
}) {
  const stock = groceries.filter((item) => item.status === "maintain" && !["Household", "Personal Care"].includes(grocerySection(item))).sort((a, b) => a.name.localeCompare(b.name));
  const weekday = new Date(`${today}T12:00:00Z`).getUTCDay();
  const monday = shiftDate(today, -((weekday + 6) % 7));
  const weeks = [0, 7].map((offset) => shiftDate(monday, offset));
  const lookup = new Map(meals.map((meal) => [`${meal.date}/${meal.slot}`, meal]));
  const person = (id: string | null) => people.find((item) => item.id === id)?.name ?? "Unassigned";
  const fmt = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", weekday: "short", timeZone: "UTC" });
  return <section className="meals-section">
    <div className="section-head"><div><h2>Weekly meal planner</h2>
      <p>Suggest meals and vote. Members set their own availability and volunteer to cook; a manager confirms the dish.</p>
    </div></div>
    {weeks.map((start) => <details key={start} open={start === weeks[0]} className="meal-week">
      <summary className="meal-week-title">Week of {fmt.format(new Date(`${start}T12:00:00Z`)).replace(/^\w+, /, "")}</summary>
      <div className="meal-days">
        {Array.from({ length: 7 }, (_, index) => shiftDate(start, index)).map((day) => <section key={day} className="lane meal-day">
          <div className="lane-heading"><h3>{fmt.format(new Date(`${day}T12:00:00Z`))}</h3></div>
          <div className="meal-slots">
            {slots.map((slot) => {
              const meal = lookup.get(`${day}/${slot}`);
              const chosen = meal?.proposals.find((proposal) => proposal.id === meal.selected_id);
              const ready = Boolean(meal?.selected_id && meal?.cook_id);
              const leader = meal?.proposals.slice().sort((a, b) => b.votes.length - a.votes.length)[0];
              return <div key={slot} className="meal-slot">
                <div className="meal-slot-head"><strong>{slot[0].toUpperCase() + slot.slice(1)}</strong>
                  {meal?.prepared ? <span className="tag maintain">Prepared</span>
                    : ready ? <span className="tag maintain">Scheduled</span>
                      : <span className="tag buy">Planning</span>}
                </div>
                {chosen ? <p><strong>{chosen.title}</strong> · Cook: {person(meal?.cook_id ?? null)}</p>
                  : <p className="item-meta">{leader ? `Leading suggestion: ${leader.title}` : "No dish selected yet."}</p>}
                {meal?.proposals.map((proposal) => <div key={proposal.id} className="meal-proposal">
                  <div><strong>{proposal.title}</strong> <small>({proposal.votes.length} vote{proposal.votes.length === 1 ? "" : "s"})</small></div>
                  {proposal.ingredients.length > 0 && <p className="item-meta">Ingredients: {proposal.ingredients.join(", ")}</p>}
                  <div className="item-actions">
                    <Action id={meal.id} proposalId={proposal.id} intent={proposal.votes.includes(member.id) ? "meal-unvote" : "meal-vote"}>
                      {proposal.votes.includes(member.id) ? "Remove my vote" : "Vote for this"}
                    </Action>
                    {member.manager && !meal.prepared && (meal.selected_id === proposal.id
                      ? <Action id={meal.id} intent="meal-unselect">Undo selection</Action>
                      : <Action id={meal.id} proposalId={proposal.id} intent="meal-select">Choose dish</Action>)}
                    {!meal.prepared && (member.manager || proposal.suggested_by === member.id) &&
                      <Action id={meal.id} proposalId={proposal.id} intent="meal-delete-proposal">Remove suggestion</Action>}
                  </div>
                </div>)}
                {meal && <div className="meal-assignments">
                  <p className="item-meta">Availability: {people.map((p) =>
                    `${p.name}: ${meal.availability[p.id] === "yes" ? "Available" : meal.availability[p.id] === "maybe" ? "Maybe" : meal.availability[p.id] === "no" ? "Unavailable" : "Not answered"}`).join(" · ")}</p>
                  {!meal.prepared && <ActionForm action={updateBoard} intent="meal-availability" id={meal.id} className="meal-availability-form">
                    <label>My availability
                      <select name="availability" defaultValue={meal.availability[member.id] ?? ""} required>
                        <option value="" disabled>Choose</option>
                        <option value="yes">Available</option>
                        <option value="maybe">Maybe</option>
                        <option value="no">Unavailable</option>
                      </select>
                    </label><Submit variant="secondary">Save</Submit>
                  </ActionForm>}
                  <div className="item-actions">
                    {!meal.prepared && !meal.cook_id && meal.availability[member.id] === "yes" &&
                      <Action id={meal.id} intent="meal-volunteer">I can cook</Action>}
                    {meal.cook_id && !meal.prepared && (meal.cook_id === member.id || member.manager) &&
                      <Action id={meal.id} intent="meal-release">Release cook</Action>}
                    {ready && !meal.prepared && (meal.cook_id === member.id || member.manager) &&
                      <Action id={meal.id} intent="meal-prepared">Mark prepared</Action>}
                    {meal.prepared && member.manager && <Action id={meal.id} intent="meal-reopen">Reopen meal</Action>}
                  </div>
                  {chosen?.ingredients.length ? <p className="item-meta">
                    Ingredient checklist: {chosen.ingredients.join(", ")}. Check your <a href="/">grocery board</a> before shopping.
                  </p> : null}
                </div>}
                {day >= today && <details className="edit-form meal-suggest"><summary>Suggest a dish</summary>
                  <ActionForm action={updateBoard} intent="meal-propose" className="entry-form" feedback>
                    <input type="hidden" name="date" value={day} />
                    <input type="hidden" name="slot" value={slot} />
                    <MealSuggestions stock={stock} slot={slot} catalog={catalog} />
                    <Submit>Suggest meal</Submit>
                  </ActionForm>
                </details>}
              </div>;
            })}
          </div>
        </section>)}
      </div>
    </details>)}
    <p className="item-meta">Suggestions and votes are shared with the household. Recipe suggestions identify missing ingredients; custom combinations use Maintain stock. Selection does not reserve or deduct quantities.</p>
  </section>;
}
