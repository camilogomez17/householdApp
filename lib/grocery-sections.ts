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
  "Produce": "Apple|Banana|Orange|Pear|Peach|Grapes|Strawberries|Blueberries|Raspberries|Blackberries|Pineapple|Mango|Papaya|Watermelon|Cantaloupe|Kiwi|Lemon|Lime|Avocado|Tomato|Potato|Sweet potato|Onion|Red onion|Garlic|Carrot|Celery|Broccoli|Cauliflower|Spinach|Kale|Lettuce|Cucumber|Bell pepper|Jalapeño|Zucchini|Eggplant|Mushrooms|Cabbage|Asparagus|Green beans|Cilantro|Parsley|Ginger|Plantain|Yuca|Scallions|Radishes|Beets|Apricot|Plum|Nectarine|Pomegranate|Grapefruit|Mandarin|Coconut|Dates|Figs|Passion fruit|Dragon fruit|Guava|Arugula|Romaine lettuce|Bok choy|Brussels sprouts|Collard greens|Swiss chard|Leek|Shallot|Turnip|Parsnip|Butternut squash|Acorn squash|Pumpkin|Corn|Okra|Snow peas|Sugar snap peas|Basil|Mint|Dill|Rosemary|Thyme|Turmeric root",
  "Meat & Poultry": "Chicken breast|Chicken thighs|Chicken wings|Whole chicken|Ground beef|Steak|Ground turkey|Turkey breast|Pork chops|Bacon|Sausage|Ham|Ground pork|Lamb|Chicken drumsticks|Chicken tenderloins|Beef brisket|Beef chuck|Beef ribs|Pork tenderloin|Pork shoulder|Pork ribs|Turkey bacon|Italian sausage|Hot dogs|Deli ham|Roast beef|Salami|Pepperoni",
  "Seafood": "Salmon|Tuna|Shrimp|Cod|Tilapia|Trout|Sardines|Crab|Lobster|Scallops|Mussels|Haddock|Halibut|Mackerel|Anchovies|Swordfish|Flounder|Sea bass|Clams|Oysters|Squid|Octopus|Smoked salmon",
  "Dairy & Eggs": "Milk|Whole milk|Skim milk|Oat milk|Almond milk|Soy milk|Eggs|Butter|Cheddar cheese|Mozzarella|Parmesan|Cream cheese|Greek yogurt|Yogurt|Sour cream|Heavy cream|Cottage cheese|Half and half|Buttermilk|Kefir|Feta cheese|Ricotta|Swiss cheese|Provolone|Gouda|Brie|Monterey Jack|String cheese|Lactose-free milk|Coconut yogurt|Margarine",
  "Bakery": "Bread|Whole wheat bread|Sourdough bread|Bagels|Croissants|Buns|Dinner rolls|Tortillas|Pita bread|English muffins|Baguette|Ciabatta|Rye bread|Multigrain bread|Naan|Flatbread|Muffins|Donuts|Cake|Pie|Brioche|Hamburger buns|Hot dog buns",
  "Pantry": "Rice|Brown rice|Pasta|Spaghetti|Flour|Sugar|Salt|Black pepper|Olive oil|Vegetable oil|Vinegar|Oats|Oatmeal|Cereal|Lentils|Black beans|Kidney beans|Chickpeas|Canned tomatoes|Tomato sauce|Peanut butter|Jam|Honey|Soy sauce|Hot sauce|Ketchup|Mustard|Mayonnaise|Quinoa|Canned tuna|Coconut milk|Chicken broth|Baking powder|Baking soda|Cinnamon|Cumin|Paprika|Jasmine rice|Basmati rice|Arborio rice|Couscous|Bulgur|Barley|Cornmeal|Cornstarch|Bread flour|Whole wheat flour|Brown sugar|Powdered sugar|Maple syrup|Agave syrup|Canola oil|Avocado oil|Sesame oil|Balsamic vinegar|Apple cider vinegar|White vinegar|Pinto beans|White beans|Split peas|Canned corn|Canned peas|Canned beans|Canned salmon|Canned sardines|Tomato paste|Vegetable broth|Beef broth|Bouillon|Penne|Macaroni|Fettuccine|Ramen|Rice noodles|Lasagna noodles|Breadcrumbs|Panko|Almond butter|Tahini|Pickles|Olives|Capers|Salsa|Barbecue sauce|Worcestershire sauce|Teriyaki sauce|Curry powder|Oregano|Basil seasoning|Garlic powder|Onion powder|Chili powder|Red pepper flakes|Nutmeg|Vanilla extract|Yeast|Cocoa powder|Chocolate chips|Gelatin|Dried fruit|Raisins|Granola",
  "Frozen Foods": "Frozen vegetables|Frozen peas|Frozen broccoli|Frozen berries|Frozen pizza|Frozen fries|Ice cream|Frozen shrimp|Frozen chicken|Frozen waffles|Frozen spinach|Frozen corn|Frozen mixed vegetables|Frozen fruit|Frozen mango|Frozen fish|Frozen meatballs|Frozen burgers|Frozen dumplings|Frozen burritos|Frozen pancakes|Frozen hash browns|Frozen meals|Sorbet",
  "Beverages": "Water|Sparkling water|Orange juice|Apple juice|Coffee|Tea|Soda|Lemonade|Sports drink|Cranberry juice|Grape juice|Pineapple juice|Tomato juice|Coconut water|Iced tea|Green tea|Black tea|Herbal tea|Ground coffee|Instant coffee|Coffee beans|Energy drink|Ginger ale|Cola|Tonic water",
  "Snacks": "Potato chips|Tortilla chips|Crackers|Popcorn|Almonds|Cashews|Peanuts|Trail mix|Cookies|Granola bars|Chocolate|Pretzels|Pistachios|Walnuts|Pecans|Sunflower seeds|Pumpkin seeds|Rice cakes|Pita chips|Cheese crackers|Fruit snacks|Protein bars|Dark chocolate|Gummy candy|Hard candy|Beef jerky",
  "Household": "Paper towels|Toilet paper|Dish soap|Laundry detergent|Trash bags|Sponges|All-purpose cleaner|Aluminum foil|Plastic wrap|Dishwasher tablets|Fabric softener|Dryer sheets|Bleach|Disinfectant wipes|Glass cleaner|Floor cleaner|Bathroom cleaner|Hand sanitizer|Napkins|Parchment paper|Wax paper|Food storage bags|Freezer bags|Food storage containers|Light bulbs|Batteries|Rubber gloves|Air freshener",
  "Personal Care": "Toothpaste|Toothbrush|Shampoo|Conditioner|Deodorant|Body wash|Hand soap|Floss|Razor|Lotion|Sunscreen|Dental floss|Mouthwash|Face wash|Moisturizer|Lip balm|Shaving cream|Cotton swabs|Cotton balls|Facial tissues|Sanitary pads|Tampons|Bandages|Hair gel|Hair spray"
};
export const groceryCatalog: GroceryCatalogItem[] = grocerySections.flatMap(section => (catalogGroups[section] ?? "").split("|").filter(Boolean).map(name => ({ name, section })));
