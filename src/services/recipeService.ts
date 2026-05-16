/**
 * Recipe & Ingredient Data Service
 * Provides local recipe data, ingredient lists, cooking details for menu items.
 * Runs 100% locally — no AI APIs.
 */

export interface RecipeInfo {
  description: string;
  cookingStyle: string;
  spiceLevel: 1 | 2 | 3 | 4 | 5;
  prepTime: string;
  calories: string;
  chefNote: string;
  ingredients: string[];
  allergens?: string[];
  servingSize?: string;
}

// Keyword-based recipe database for common Indian restaurant items
const RECIPE_DB: Record<string, RecipeInfo> = {
  "idli": {
    description: "Traditional South Indian steamed rice cakes made from fermented rice-lentil batter. Soft, fluffy, and naturally healthy.",
    cookingStyle: "Steamed",
    spiceLevel: 1,
    prepTime: "15 min",
    calories: "120 kcal",
    chefNote: "Our batter is fermented for 12 hours for the perfect texture.",
    ingredients: ["Rice batter", "Urad dal", "Fenugreek seeds", "Salt", "Water"],
    allergens: ["Lentils"],
    servingSize: "2 pieces",
  },
  "dosa": {
    description: "Crispy golden crepe made from a fermented rice and lentil batter, cooked to perfection on a hot griddle.",
    cookingStyle: "Pan-fried",
    spiceLevel: 2,
    prepTime: "10 min",
    calories: "180 kcal",
    chefNote: "Spread thin and cooked until golden for maximum crispiness.",
    ingredients: ["Rice batter", "Urad dal", "Fenugreek seeds", "Ghee", "Potato masala", "Mustard seeds"],
    allergens: ["Lentils", "Dairy"],
    servingSize: "1 piece",
  },
  "uttappam": {
    description: "Traditional South Indian uthappam made using fermented rice-lentil batter topped with caramelized onions.",
    cookingStyle: "Pan-fried",
    spiceLevel: 2,
    prepTime: "12 min",
    calories: "200 kcal",
    chefNote: "Thick, fluffy, and loaded with fresh vegetable toppings.",
    ingredients: ["Rice batter", "Onion", "Tomato", "Curry leaves", "Green chilli", "Mustard oil"],
    allergens: ["Lentils"],
    servingSize: "1 piece",
  },
  "biryani": {
    description: "Fragrant basmati rice layered with aromatic spices, slow-cooked in a sealed pot (dum) for a rich, flavorful experience.",
    cookingStyle: "Dum (slow-cooked)",
    spiceLevel: 3,
    prepTime: "45 min",
    calories: "450 kcal",
    chefNote: "Each biryani is sealed with dough and cooked on dum for authentic flavor.",
    ingredients: ["Basmati rice", "Saffron", "Ghee", "Whole spices", "Onion", "Yogurt", "Mint", "Coriander"],
    allergens: ["Dairy", "Nuts"],
    servingSize: "1 plate",
  },
  "chicken": {
    description: "Tender chicken pieces cooked in a rich, aromatic gravy with a blend of traditional spices.",
    cookingStyle: "Slow-cooked",
    spiceLevel: 3,
    prepTime: "30 min",
    calories: "350 kcal",
    chefNote: "Marinated overnight for deep flavor penetration.",
    ingredients: ["Chicken", "Onion", "Tomato", "Ginger-garlic paste", "Spice blend", "Cream", "Butter"],
    allergens: ["Dairy"],
    servingSize: "1 serving",
  },
  "paneer": {
    description: "Soft cottage cheese cubes cooked in a creamy, spiced gravy that melts in your mouth.",
    cookingStyle: "Slow-cooked",
    spiceLevel: 2,
    prepTime: "25 min",
    calories: "280 kcal",
    chefNote: "We use freshly made paneer for the softest texture.",
    ingredients: ["Paneer", "Tomato", "Onion", "Cashew paste", "Cream", "Butter", "Spices", "Kasuri methi"],
    allergens: ["Dairy", "Nuts"],
    servingSize: "1 serving",
  },
  "samosa": {
    description: "Crispy golden pastry triangles stuffed with spiced potato and peas filling.",
    cookingStyle: "Deep-fried",
    spiceLevel: 2,
    prepTime: "20 min",
    calories: "200 kcal",
    chefNote: "Hand-folded with love, fried to golden perfection.",
    ingredients: ["Flour", "Potato", "Green peas", "Cumin", "Coriander", "Green chilli", "Oil"],
    allergens: ["Gluten"],
    servingSize: "2 pieces",
  },
  "naan": {
    description: "Soft leavened bread baked in a traditional tandoor oven until perfectly puffed.",
    cookingStyle: "Tandoor-baked",
    spiceLevel: 1,
    prepTime: "8 min",
    calories: "150 kcal",
    chefNote: "Fresh from our clay tandoor, brushed with garlic butter.",
    ingredients: ["Flour", "Yogurt", "Yeast", "Garlic", "Butter", "Coriander"],
    allergens: ["Gluten", "Dairy"],
    servingSize: "1 piece",
  },
  "roti": {
    description: "Whole wheat flatbread cooked on a hot griddle, a staple of Indian cuisine.",
    cookingStyle: "Griddle-cooked",
    spiceLevel: 1,
    prepTime: "5 min",
    calories: "100 kcal",
    chefNote: "Made fresh to order with whole wheat flour.",
    ingredients: ["Whole wheat flour", "Water", "Salt", "Ghee"],
    allergens: ["Gluten", "Dairy"],
    servingSize: "1 piece",
  },
  "parotta": {
    description: "Flaky, layered South Indian flatbread with a crispy exterior and soft interior.",
    cookingStyle: "Pan-fried",
    spiceLevel: 1,
    prepTime: "10 min",
    calories: "250 kcal",
    chefNote: "Hand-stretched and layered for maximum flakiness.",
    ingredients: ["Maida flour", "Egg", "Oil", "Sugar", "Salt"],
    allergens: ["Gluten", "Egg"],
    servingSize: "1 piece",
  },
  "dal": {
    description: "Comforting yellow lentils simmered with aromatic spices and finished with a smoky tadka.",
    cookingStyle: "Slow-cooked",
    spiceLevel: 2,
    prepTime: "25 min",
    calories: "180 kcal",
    chefNote: "Our tadka uses real ghee for an authentic smoky finish.",
    ingredients: ["Toor dal", "Turmeric", "Ghee", "Mustard seeds", "Cumin", "Red chilli", "Garlic"],
    allergens: ["Lentils", "Dairy"],
    servingSize: "1 bowl",
  },
  "curry": {
    description: "A rich, aromatic curry cooked with a blend of freshly ground spices.",
    cookingStyle: "Slow-cooked",
    spiceLevel: 3,
    prepTime: "30 min",
    calories: "300 kcal",
    chefNote: "Spice blend freshly ground daily for maximum aroma.",
    ingredients: ["Onion", "Tomato", "Ginger-garlic", "Spice blend", "Coconut milk", "Curry leaves"],
    allergens: [],
    servingSize: "1 serving",
  },
  "soup": {
    description: "Warm and comforting soup made with fresh ingredients and aromatic herbs.",
    cookingStyle: "Simmered",
    spiceLevel: 1,
    prepTime: "15 min",
    calories: "100 kcal",
    chefNote: "Prepared fresh to order with no preservatives.",
    ingredients: ["Fresh vegetables", "Herbs", "Pepper", "Salt", "Butter"],
    allergens: ["Dairy"],
    servingSize: "1 bowl",
  },
  "fry": {
    description: "Crispy and golden, seasoned with a vibrant spice blend and fried to perfection.",
    cookingStyle: "Deep-fried",
    spiceLevel: 3,
    prepTime: "15 min",
    calories: "280 kcal",
    chefNote: "Double-fried for extra crunch and flavor.",
    ingredients: ["Protein/Vegetables", "Rice flour", "Corn flour", "Red chilli", "Curry leaves", "Pepper"],
    allergens: [],
    servingSize: "1 plate",
  },
  "rice": {
    description: "Perfectly cooked basmati rice, fluffy and aromatic, the ideal companion for any curry.",
    cookingStyle: "Steamed",
    spiceLevel: 1,
    prepTime: "20 min",
    calories: "200 kcal",
    chefNote: "We use aged basmati rice for the best texture and aroma.",
    ingredients: ["Basmati rice", "Water", "Salt", "Bay leaf", "Cardamom"],
    allergens: [],
    servingSize: "1 plate",
  },
  "lassi": {
    description: "Traditional yogurt-based drink, thick and creamy, blended with your choice of flavors.",
    cookingStyle: "Blended",
    spiceLevel: 1,
    prepTime: "5 min",
    calories: "150 kcal",
    chefNote: "Made with fresh, thick homemade yogurt.",
    ingredients: ["Yogurt", "Sugar", "Cardamom", "Ice", "Fruit pulp"],
    allergens: ["Dairy"],
    servingSize: "1 glass",
  },
  "coffee": {
    description: "Classic South Indian filter coffee, strong and aromatic, served in a traditional davara tumbler.",
    cookingStyle: "Brewed & filtered",
    spiceLevel: 1,
    prepTime: "5 min",
    calories: "60 kcal",
    chefNote: "Brewed with a special 80:20 coffee-chicory blend.",
    ingredients: ["Coffee powder", "Chicory", "Milk", "Sugar", "Water"],
    allergens: ["Dairy"],
    servingSize: "1 cup",
  },
  "tea": {
    description: "Spiced milk tea brewed with aromatic whole spices for a warming, comforting cup.",
    cookingStyle: "Brewed",
    spiceLevel: 1,
    prepTime: "5 min",
    calories: "50 kcal",
    chefNote: "Real spices — ginger, cardamom, cinnamon — no powder shortcuts.",
    ingredients: ["Tea leaves", "Milk", "Ginger", "Cardamom", "Cinnamon", "Sugar"],
    allergens: ["Dairy"],
    servingSize: "1 cup",
  },
  "gulab jamun": {
    description: "Soft, golden milk-solid dumplings soaked in warm rose-scented sugar syrup.",
    cookingStyle: "Deep-fried & soaked",
    spiceLevel: 1,
    prepTime: "20 min",
    calories: "300 kcal",
    chefNote: "Served warm for the ultimate melt-in-your-mouth experience.",
    ingredients: ["Milk powder", "Flour", "Ghee", "Sugar", "Rose water", "Cardamom", "Saffron"],
    allergens: ["Dairy", "Gluten"],
    servingSize: "2 pieces",
  },
  "ice cream": {
    description: "Premium creamy ice cream made with real ingredients and natural flavors.",
    cookingStyle: "Frozen",
    spiceLevel: 1,
    prepTime: "Ready to serve",
    calories: "200 kcal",
    chefNote: "Scooped fresh from our artisanal ice cream selection.",
    ingredients: ["Milk", "Cream", "Sugar", "Natural flavors"],
    allergens: ["Dairy"],
    servingSize: "2 scoops",
  },
  "mutton": {
    description: "Succulent mutton pieces slow-cooked until fork-tender in a rich, spiced gravy.",
    cookingStyle: "Slow-cooked",
    spiceLevel: 4,
    prepTime: "45 min",
    calories: "400 kcal",
    chefNote: "Slow-cooked for 2+ hours until the meat falls off the bone.",
    ingredients: ["Mutton", "Onion", "Tomato", "Yogurt", "Whole spices", "Ginger-garlic", "Ghee"],
    allergens: ["Dairy"],
    servingSize: "1 serving",
  },
  "fish": {
    description: "Fresh catch of the day, prepared with coastal spices and cooked to flaky perfection.",
    cookingStyle: "Pan-fried / Curry",
    spiceLevel: 3,
    prepTime: "20 min",
    calories: "250 kcal",
    chefNote: "We source fresh fish daily from local markets.",
    ingredients: ["Fresh fish", "Turmeric", "Red chilli", "Tamarind", "Curry leaves", "Coconut"],
    allergens: ["Fish"],
    servingSize: "1 serving",
  },
  "prawn": {
    description: "Juicy prawns tossed in aromatic spices, bursting with coastal flavors.",
    cookingStyle: "Tossed / Curry",
    spiceLevel: 3,
    prepTime: "20 min",
    calories: "220 kcal",
    chefNote: "Fresh prawns cleaned and deveined, cooked to juicy perfection.",
    ingredients: ["Prawns", "Black pepper", "Curry leaves", "Garlic", "Coconut oil", "Onion"],
    allergens: ["Shellfish"],
    servingSize: "1 serving",
  },
  "korma": {
    description: "A mild, creamy curry with a rich coconut and cashew-based gravy.",
    cookingStyle: "Slow-cooked",
    spiceLevel: 2,
    prepTime: "30 min",
    calories: "320 kcal",
    chefNote: "Our korma uses real cashew paste for a luxurious, silky texture.",
    ingredients: ["Vegetables/Meat", "Cashew paste", "Coconut cream", "Onion", "Mild spices", "Ghee"],
    allergens: ["Nuts", "Dairy"],
    servingSize: "1 serving",
  },
  "burger": {
    description: "A juicy, thick patty sandwiched in a toasted brioche bun with fresh toppings.",
    cookingStyle: "Grilled",
    spiceLevel: 2,
    prepTime: "12 min",
    calories: "450 kcal",
    chefNote: "Patty grilled over high heat for that perfect charred crust.",
    ingredients: ["Patty", "Brioche bun", "Lettuce", "Tomato", "Onion", "Cheese", "Sauce"],
    allergens: ["Gluten", "Dairy"],
    servingSize: "1 piece",
  },
  "pizza": {
    description: "Hand-tossed pizza with a crispy base, tangy sauce, and generous toppings.",
    cookingStyle: "Oven-baked",
    spiceLevel: 2,
    prepTime: "20 min",
    calories: "500 kcal",
    chefNote: "Our dough is hand-stretched and baked in a stone oven.",
    ingredients: ["Pizza dough", "Mozzarella", "Tomato sauce", "Fresh toppings", "Olive oil", "Herbs"],
    allergens: ["Gluten", "Dairy"],
    servingSize: "1 pizza (8 slices)",
  },
};

// Default fallback recipe
const DEFAULT_RECIPE: RecipeInfo = {
  description: "A carefully crafted dish made with the freshest ingredients and authentic flavors.",
  cookingStyle: "Chef's special preparation",
  spiceLevel: 2,
  prepTime: "20 min",
  calories: "250 kcal",
  chefNote: "Prepared with care using our chef's secret recipe.",
  ingredients: ["Fresh ingredients", "Aromatic spices", "Herbs", "Seasoning"],
  allergens: [],
  servingSize: "1 serving",
};

/**
 * Get recipe info for a menu item by name.
 * Uses fuzzy keyword matching against the recipe database.
 */
export function getRecipeInfo(itemName: string): RecipeInfo {
  const lower = itemName.toLowerCase();

  // Try exact match first
  if (RECIPE_DB[lower]) return RECIPE_DB[lower];

  // Try keyword matching
  for (const [keyword, recipe] of Object.entries(RECIPE_DB)) {
    if (lower.includes(keyword)) {
      return {
        ...recipe,
        // Customize description with actual item name
        description: recipe.description.replace(/^[A-Z]/, (c) => c),
      };
    }
  }

  return DEFAULT_RECIPE;
}

/**
 * Get spice level label
 */
export function getSpiceLevelLabel(level: number): string {
  const labels = ["", "Mild", "Medium", "Spicy", "Hot", "Extra Hot"];
  return labels[level] || "Medium";
}

/**
 * Get spice level emoji indicator
 */
export function getSpiceLevelEmoji(level: number): string {
  return "🌶️".repeat(level);
}
