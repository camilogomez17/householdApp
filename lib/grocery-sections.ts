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
