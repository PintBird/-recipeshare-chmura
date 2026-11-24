import { describe, expect, it } from "vitest";
import { toRecipeWithSummary } from "./recipeMapping";

describe("Neon recipe mapping", () => {
  it("maps database fields and rating summaries to the API recipe shape", () => {
    const recipe = toRecipeWithSummary({
      id: "00000000-0000-4000-8000-000000000001",
      owner_id: null,
      author_name: "Niloofar",
      title: "Persian Saffron Chicken",
      cuisine: "Iranian",
      category: "Main Dish",
      ingredients: ["Chicken", "Saffron"],
      steps: ["Season", "Cook"],
      prep_time_minutes: 45,
      image_url: "https://example.com/chicken.jpg",
      created_at: "2026-01-01T00:00:00.000Z",
      average_rating: 4.5,
      rating_count: 2,
    });

    expect(recipe).toMatchObject({
      id: "00000000-0000-4000-8000-000000000001",
      ownerId: null,
      authorName: "Niloofar",
      prepTimeMinutes: 45,
      imageUrl: "https://example.com/chicken.jpg",
      averageRating: 4.5,
      ratingCount: 2,
    });
  });
});
