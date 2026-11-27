import type { MealSlot } from "./data";
export type Recipe = { title: string; slot: MealSlot; ingredients: string[] };
const groups: Record<MealSlot, string[]> = {
  "breakfast": [
    "Scrambled eggs|Eggs,Butter,Salt",
    "Omelette|Eggs,Cheddar cheese,Bell pepper",
    "Oatmeal|Oats,Milk,Banana",
    "Pancakes|Flour,Milk,Eggs,Baking powder",
    "French toast|Bread,Eggs,Milk,Cinnamon",
    "Avocado toast|Bread,Avocado,Salt",
    "Yogurt parfait|Greek yogurt,Blueberries,Oats",
    "Breakfast burrito|Tortillas,Eggs,Black beans,Cheddar cheese",
    "Breakfast sandwich|English muffins,Eggs,Cheddar cheese",
    "Fruit salad|Apple,Banana,Grapes"
  ],
  "lunch": [
    "Chicken salad|Chicken breast,Lettuce,Tomato,Cucumber",
    "Turkey sandwich|Bread,Turkey breast,Lettuce,Tomato",
    "Tuna sandwich|Bread,Canned tuna,Mayonnaise",
    "Chicken rice bowl|Chicken breast,Rice,Broccoli",
    "Bean burrito|Tortillas,Black beans,Rice,Cheddar cheese",
    "Grilled cheese|Bread,Cheddar cheese,Butter",
    "Caesar salad|Lettuce,Chicken breast,Parmesan",
    "Lentil soup|Lentils,Carrot,Onion,Chicken broth",
    "Quesadilla|Tortillas,Cheddar cheese",
    "Egg salad sandwich|Eggs,Mayonnaise,Bread",
    "Hummus wrap|Chickpeas,Tortillas,Cucumber,Olive oil",
    "Tomato soup|Canned tomatoes,Onion,Chicken broth"
  ],
  "dinner": [
    "Spaghetti bolognese|Spaghetti,Ground beef,Tomato sauce,Onion",
    "Grilled chicken|Chicken breast,Olive oil,Salt",
    "Salmon and rice|Salmon,Rice,Broccoli",
    "Beef stew|Steak,Potato,Carrot,Onion",
    "Chicken soup|Chicken breast,Carrot,Celery,Chicken broth",
    "Chicken stir fry|Chicken breast,Broccoli,Bell pepper,Soy sauce,Rice",
    "Beef tacos|Ground beef,Tortillas,Tomato,Lettuce",
    "Roast chicken|Whole chicken,Potato,Carrot",
    "Pork chops|Pork chops,Potato,Green beans",
    "Shrimp pasta|Shrimp,Pasta,Garlic,Olive oil",
    "Rice and beans|Rice,Black beans,Onion",
    "Vegetable curry|Potato,Carrot,Coconut milk,Rice",
    "Baked tilapia|Tilapia,Lemon,Olive oil",
    "Pasta primavera|Pasta,Zucchini,Broccoli,Bell pepper",
    "Chicken fajitas|Chicken breast,Bell pepper,Onion,Tortillas",
    "Lentil stew|Lentils,Carrot,Onion,Tomato"
  ]
};
export const mealCatalog: Recipe[] = (Object.keys(groups) as MealSlot[]).flatMap(slot => groups[slot].map(row => { const [title, ingredients] = row.split("|"); return {title, slot, ingredients: ingredients.split(",")}; }));
export const normalizeMeal = (value: string) => value.trim().toLowerCase().replace(/\s+/g, " ");
