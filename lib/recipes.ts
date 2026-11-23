export const CUISINES = [
  "American",
  "Arabic",
  "Chinese",
  "German",
  "Indian",
  "Iranian",
  "Italian",
  "Japanese",
  "Mexican",
  "Other",
] as const;

export const CATEGORIES = [
  "Breakfast",
  "Main Dish",
  "Fast Food",
  "Soup",
  "Salad",
  "Dessert",
  "Snack",
  "Drink",
] as const;

export type Cuisine = (typeof CUISINES)[number];
export type Category = (typeof CATEGORIES)[number];

export type Recipe = {
  id: string;
  authorName: string;
  title: string;
  cuisine: Cuisine;
  category: Category;
  ingredients: string[];
  steps: string[];
  prepTimeMinutes: number;
  imageUrl: string;
  averageRating: number;
  ratingCount: number;
};

export type RecipeInput = {
  authorName: string;
  title: string;
  cuisine: string;
  category: string;
  ingredients: string;
  steps: string;
  prepTimeMinutes: string;
  imageUrl: string;
};

export type RecipeFieldErrors = Partial<Record<keyof RecipeInput, string>>;

function isCuisine(value: string): value is Cuisine {
  return CUISINES.some((cuisine) => cuisine === value);
}

function isCategory(value: string): value is Category {
  return CATEGORIES.some((category) => category === value);
}

export function isRecipe(value: unknown): value is Recipe {
  if (typeof value !== "object" || value === null) return false;
  const recipe = value as Record<string, unknown>;
  return (
    typeof recipe.id === "string" &&
    typeof recipe.authorName === "string" &&
    typeof recipe.title === "string" &&
    typeof recipe.cuisine === "string" &&
    isCuisine(recipe.cuisine) &&
    typeof recipe.category === "string" &&
    isCategory(recipe.category) &&
    Array.isArray(recipe.ingredients) &&
    recipe.ingredients.every((ingredient) => typeof ingredient === "string") &&
    Array.isArray(recipe.steps) &&
    recipe.steps.every((step) => typeof step === "string") &&
    typeof recipe.prepTimeMinutes === "number" &&
    typeof recipe.imageUrl === "string" &&
    typeof recipe.averageRating === "number" &&
    typeof recipe.ratingCount === "number"
  );
}

export function isRecipeInput(value: unknown): value is RecipeInput {
  if (typeof value !== "object" || value === null) return false;
  const input = value as Record<string, unknown>;
  return (
    typeof input.authorName === "string" &&
    typeof input.title === "string" &&
    typeof input.cuisine === "string" &&
    typeof input.category === "string" &&
    typeof input.ingredients === "string" &&
    typeof input.steps === "string" &&
    typeof input.prepTimeMinutes === "string" &&
    typeof input.imageUrl === "string"
  );
}

export function filterRecipes(
  recipes: Recipe[],
  cuisine: string,
  category: string,
): Recipe[] {
  return recipes.filter(
    (recipe) =>
      (!cuisine || recipe.cuisine === cuisine) &&
      (!category || recipe.category === category),
  );
}

export function validateRecipeInput(input: RecipeInput): RecipeFieldErrors {
  const errors: RecipeFieldErrors = {};
  const requiredFields: (keyof RecipeInput)[] = [
    "authorName",
    "title",
    "cuisine",
    "category",
    "ingredients",
    "steps",
    "prepTimeMinutes",
    "imageUrl",
  ];

  for (const field of requiredFields) {
    if (!input[field].trim()) {
      errors[field] = "This field is required.";
    }
  }

  if (input.cuisine && !isCuisine(input.cuisine)) {
    errors.cuisine = "Choose a cuisine from the list.";
  }
  if (input.category && !isCategory(input.category)) {
    errors.category = "Choose a category from the list.";
  }
  if (input.prepTimeMinutes.trim()) {
    const minutes = Number(input.prepTimeMinutes);
    if (!Number.isInteger(minutes)) {
      errors.prepTimeMinutes = "Enter a whole number of minutes.";
    } else if (minutes <= 0) {
      errors.prepTimeMinutes = "Enter a number greater than zero.";
    }
  }
  if (input.imageUrl.trim()) {
    try {
      const url = new URL(input.imageUrl);
      if (url.protocol !== "http:" && url.protocol !== "https:") {
        errors.imageUrl = "Enter an image URL starting with http:// or https://.";
      }
    } catch {
      errors.imageUrl = "Enter a valid image URL.";
    }
  }

  return errors;
}

export function makeRecipe(id: string, input: RecipeInput): Recipe {
  const errors = validateRecipeInput(input);
  if (
    Object.keys(errors).length > 0 ||
    !isCuisine(input.cuisine) ||
    !isCategory(input.category)
  ) {
    throw new Error("Cannot create a recipe with invalid fields.");
  }

  return {
    id,
    authorName: input.authorName.trim(),
    title: input.title.trim(),
    cuisine: input.cuisine,
    category: input.category,
    ingredients: input.ingredients
      .split(/\r?\n/)
      .map((item) => item.trim())
      .filter(Boolean),
    steps: input.steps
      .split(/\r?\n/)
      .map((step) => step.trim())
      .filter(Boolean),
    prepTimeMinutes: Number(input.prepTimeMinutes),
    imageUrl: input.imageUrl.trim(),
    averageRating: 0,
    ratingCount: 0,
  };
}
