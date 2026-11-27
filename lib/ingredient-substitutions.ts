import { normalizeMeal, type Recipe } from "./meal-catalog";

type StockItem = { id: string; name: string };
const alternatives: Record<string, string[]> = {
  milk: ["whole milk", "skim milk", "lactose-free milk", "almond milk", "oat milk", "soy milk"],
  "cheddar cheese": ["mozzarella", "monterey jack", "gouda", "colby jack", "provolone"],
  rice: ["jasmine rice", "basmati rice", "brown rice", "white rice"],
  butter: ["margarine", "olive oil", "vegetable oil"],
  "chicken breast": ["chicken thighs", "chicken tenderloins"],
  sugar: ["brown sugar"],
  bread: ["whole wheat bread", "sourdough bread", "multigrain bread", "rye bread"],
  "olive oil": ["avocado oil", "canola oil", "vegetable oil"],
  "black beans": ["pinto beans", "kidney beans"],
  "chicken broth": ["vegetable broth"],
  onion: ["red onion", "shallot"],
  pasta: ["penne", "spaghetti", "fettuccine", "macaroni"],
  oats: ["oatmeal"],
  "bell pepper": ["red bell pepper", "green bell pepper", "yellow bell pepper"],
};
const recipeRules: Record<string, Record<string, string[]>> = {
  pancakes: { butter: ["margarine"], milk: alternatives.milk },
  "french toast": { milk: alternatives.milk },
  "grilled cheese": { butter: ["margarine"], "cheddar cheese": ["mozzarella", "monterey jack", "gouda", "provolone"] },
  "breakfast sandwich": { "cheddar cheese": ["mozzarella", "monterey jack", "gouda", "provolone"] },
};
export function matchRecipe<T extends StockItem>(recipe: Recipe, stock: T[]) {
  const ordered = [...stock].sort((a,b) => a.name.localeCompare(b.name) || a.id.localeCompare(b.id));
  const matches = recipe.ingredients.map(required => {
    const key = normalizeMeal(required);
    const exact = ordered.find(item => normalizeMeal(item.name) === key);
    return { required, item: exact, weight: exact ? 1 : 0 };
  });
  const used = new Set(matches.flatMap(match => match.item ? [match.item.id] : []));
  for (const match of matches) {
    if (match.item) continue;
    const key = normalizeMeal(match.required);
    const allowed = recipeRules[normalizeMeal(recipe.title)]?.[key] ?? alternatives[key] ?? [];
    for (const alternative of allowed) {
      const item = ordered.find(row => !used.has(row.id) && normalizeMeal(row.name) === alternative);
      if (item) { match.item = item; match.weight = 0.8; used.add(item.id); break; }
    }
  }
  const ids = [...new Set(matches.flatMap(match => match.item ? [match.item.id] : []))];
  const missing = matches.filter(match => !match.item).map(match => match.required);
  const substitutions = matches.filter(match => match.item && match.weight === 0.8).map(match => ({ required: match.required, actual: match.item!.name }));
  const count = matches.length;
  return { ids, missing, substitutions, ingredients: matches.map(match => match.item?.name ?? match.required),
    coverage: count ? (count - missing.length) / count : 0,
    score: count ? matches.reduce((sum, match) => sum + match.weight, 0) / count : 0 };
}
