import { describe, expect, it } from "vitest";
import {
  filterRecipes,
  makeRecipe,
  validateRecipeInput,
  type RecipeInput,
  type Recipe,
} from "./recipes";
import { summarizeRatings } from "./ratings";

const validInput: RecipeInput = {
  authorName: "Jamie Lee",
  title: "Herb rice",
  cuisine: "Iranian",
  category: "Main Dish",
  ingredients: "2 cups rice\nFresh herbs",
  steps: "Rinse the rice\nCook until tender",
  prepTimeMinutes: "35",
  imageUrl: "https://example.com/herb-rice.jpg",
};

const testRecipes: Recipe[] = [
  {
    id: "iranian-main",
    authorName: "Niloofar",
    title: "Saffron Chicken",
    cuisine: "Iranian",
    category: "Main Dish",
    ingredients: ["Chicken", "Saffron"],
    steps: ["Season", "Cook"],
    prepTimeMinutes: 45,
    imageUrl: "https://example.com/chicken.jpg",
    averageRating: 4.5,
    ratingCount: 2,
  },
  {
    id: "italian-soup",
    authorName: "Marco",
    title: "Tomato Soup",
    cuisine: "Italian",
    category: "Soup",
    ingredients: ["Tomatoes"],
    steps: ["Simmer"],
    prepTimeMinutes: 30,
    imageUrl: "https://example.com/soup.jpg",
    averageRating: 0,
    ratingCount: 0,
  },
];

describe("recipe requirements", () => {
  it("combines cuisine and category filters and clears to all recipes", () => {
    const iranianMain = filterRecipes(testRecipes, "Iranian", "Main Dish");
    expect(iranianMain.map((recipe) => recipe.id)).toEqual(["iranian-main"]);
    expect(filterRecipes(testRecipes, "", "")).toHaveLength(testRecipes.length);
    expect(filterRecipes(testRecipes, "Japanese", "Dessert")).toEqual([]);
  });

  it("reports each missing required field without creating a recipe", () => {
    const incomplete = { ...validInput, authorName: " ", cuisine: "", imageUrl: "" };
    const errors = validateRecipeInput(incomplete);

    expect(Object.keys(errors)).toEqual(["authorName", "cuisine", "imageUrl"]);
    expect(() => makeRecipe("new-recipe", incomplete)).toThrow(
      "Cannot create a recipe with invalid fields.",
    );
  });

  it("creates a recipe with parsed ingredients and ordered steps", () => {
    const recipe = makeRecipe("new-recipe", validInput);

    expect(recipe).toMatchObject({
      id: "new-recipe",
      authorName: "Jamie Lee",
      cuisine: "Iranian",
      category: "Main Dish",
      ingredients: ["2 cups rice", "Fresh herbs"],
      steps: ["Rinse the rice", "Cook until tender"],
      prepTimeMinutes: 35,
    });
  });

  it("calculates a rating average and count, including no ratings", () => {
    const beforeRating = summarizeRatings([2, 4]);
    const afterRating = summarizeRatings([2, 4, 5]);

    expect(beforeRating).toEqual({ averageRating: 3, ratingCount: 2 });
    expect(afterRating).toEqual({
      averageRating: 11 / 3,
      ratingCount: 3,
    });
    expect(summarizeRatings([])).toEqual({ averageRating: 0, ratingCount: 0 });
  });
});
