export const grocerySections = ["Produce", "Meat & Poultry", "Seafood", "Dairy & Eggs", "Bakery", "Pantry", "Frozen Foods", "Beverages", "Snacks", "Household", "Personal Care", "Other"] as const;
export type GrocerySection = typeof grocerySections[number];

export function grocerySection(item: { name: string; section?: GrocerySection }): GrocerySection {
  if (item.section && grocerySections.includes(item.section)) return item.section;
  const name = item.name.toLowerCase();
  const rules: [GrocerySection, RegExp][] = [
    ["Frozen Foods", /\bfrozen\b|ice cream/],
    ["Household", /paper towels?|toilet paper|detergent|cleaner|trash bags?|dish soap/],
    ["Personal Care", /toothpaste|shampoo|deodorant|body wash|toothbrush|\bsoap\b/],
    ["Beverages", /\b(water|juice|coffee|tea|soda)\b/],
    ["Dairy & Eggs", /\b(milk|cheese|eggs?|yogurt|butter|cream)\b/],
    ["Meat & Poultry", /\b(chicken|beef|pork|turkey|steak|bacon|sausage)\b/],
    ["Seafood", /\b(fish|salmon|tuna|shrimp|cod|tilapia)\b/],
    ["Bakery", /\b(bread|bagels?|rolls?|croissants?|buns?)\b/],
    ["Snacks", /\b(chips|crackers|nuts|cookies|popcorn)\b/],
    ["Produce", /\b(apples?|bananas?|oranges?|onions?|potato(?:es)?|tomato(?:es)?|lettuce|carrots?|broccoli|spinach|avocados?|garlic|peppers?|cucumbers?|berries|lemons?|limes?|cilantro)\b/],
    ["Pantry", /\b(rice|pasta|beans?|flour|sugar|salt|oil|oats|oatmeal|cereal|spaghetti|sauce|spices?|lentils?)\b/],
  ];
  return rules.find(([, pattern]) => pattern.test(name))?.[0] ?? "Other";
}

export type GroceryCatalogItem = { name: string; section: GrocerySection };
export const normalizeGroceryName = (name: string) => name.trim().toLowerCase().replace(/\s+/g, " ");
const catalogGroups: Partial<Record<GrocerySection, string>> = {
  "Produce": "Apple|Banana|Orange|Pear|Peach|Grapes|Strawberries|Blueberries|Raspberries|Blackberries|Pineapple|Mango|Papaya|Watermelon|Cantaloupe|Kiwi|Lemon|Lime|Avocado|Tomato|Potato|Sweet potato|Onion|Red onion|Garlic|Carrot|Celery|Broccoli|Cauliflower|Spinach|Kale|Lettuce|Cucumber|Bell pepper|Jalapeño|Zucchini|Eggplant|Mushrooms|Cabbage|Asparagus|Green beans|Cilantro|Parsley|Ginger|Plantain|Yuca|Scallions|Radishes|Beets",
  "Meat & Poultry": "Chicken breast|Chicken thighs|Chicken wings|Whole chicken|Ground beef|Steak|Ground turkey|Turkey breast|Pork chops|Bacon|Sausage|Ham|Ground pork|Lamb",
  "Seafood": "Salmon|Tuna|Shrimp|Cod|Tilapia|Trout|Sardines|Crab|Lobster|Scallops|Mussels",
  "Dairy & Eggs": "Milk|Whole milk|Skim milk|Oat milk|Almond milk|Soy milk|Eggs|Butter|Cheddar cheese|Mozzarella|Parmesan|Cream cheese|Greek yogurt|Yogurt|Sour cream|Heavy cream|Cottage cheese",
  "Bakery": "Bread|Whole wheat bread|Sourdough bread|Bagels|Croissants|Buns|Dinner rolls|Tortillas|Pita bread|English muffins",
  "Pantry": "Rice|Brown rice|Pasta|Spaghetti|Flour|Sugar|Salt|Black pepper|Olive oil|Vegetable oil|Vinegar|Oats|Oatmeal|Cereal|Lentils|Black beans|Kidney beans|Chickpeas|Canned tomatoes|Tomato sauce|Peanut butter|Jam|Honey|Soy sauce|Hot sauce|Ketchup|Mustard|Mayonnaise|Quinoa|Canned tuna|Coconut milk|Chicken broth|Baking powder|Baking soda|Cinnamon|Cumin|Paprika",
  "Frozen Foods": "Frozen vegetables|Frozen peas|Frozen broccoli|Frozen berries|Frozen pizza|Frozen fries|Ice cream|Frozen shrimp|Frozen chicken|Frozen waffles",
  "Beverages": "Water|Sparkling water|Orange juice|Apple juice|Coffee|Tea|Soda|Lemonade|Sports drink",
  "Snacks": "Potato chips|Tortilla chips|Crackers|Popcorn|Almonds|Cashews|Peanuts|Trail mix|Cookies|Granola bars|Chocolate|Pretzels",
  "Household": "Paper towels|Toilet paper|Dish soap|Laundry detergent|Trash bags|Sponges|All-purpose cleaner|Aluminum foil|Plastic wrap|Dishwasher tablets",
  "Personal Care": "Toothpaste|Toothbrush|Shampoo|Conditioner|Deodorant|Body wash|Hand soap|Floss|Razor|Lotion|Sunscreen"
};
export const groceryCatalog: GroceryCatalogItem[] = grocerySections.flatMap(section => (catalogGroups[section] ?? "").split("|").filter(Boolean).map(name => ({ name, section })));
