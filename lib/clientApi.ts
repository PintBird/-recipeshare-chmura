import { isRecipe, isRecipeInput } from "@/lib/recipes";
import type { Recipe, RecipeInput } from "@/lib/recipes";
import { isRatingSummary } from "@/lib/ratings";
import type { RatingSummary } from "@/lib/ratings";

type RatingResult = { summary: RatingSummary };

async function readResponse<T>(
  response: Response,
  isExpected: (value: unknown) => value is T,
): Promise<T> {
  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    throw new Error("The server returned an unreadable response.");
  }

  if (!response.ok) {
    if (
      typeof payload === "object" &&
      payload !== null &&
      "error" in payload &&
      typeof payload.error === "string"
    ) {
      throw new Error(payload.error);
    }
    throw new Error("The request could not be completed.");
  }

  if (!isExpected(payload)) {
    throw new Error("The server returned data in an unexpected format.");
  }
  return payload;
}

function isRecipeList(value: unknown): value is Recipe[] {
  return Array.isArray(value) && value.every(isRecipe);
}

function isRatingResult(value: unknown): value is RatingResult {
  if (typeof value !== "object" || value === null || !("summary" in value)) {
    return false;
  }
  return isRatingSummary(value.summary);
}

export async function fetchRecipes(): Promise<Recipe[]> {
  const response = await fetch("/api/recipes", { cache: "no-store" });
  return readResponse(response, isRecipeList);
}

export async function createRecipe(input: RecipeInput): Promise<Recipe> {
  if (!isRecipeInput(input)) {
    throw new Error("Recipe details are incomplete.");
  }
  const response = await fetch("/api/recipes", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return readResponse(response, isRecipe);
}

export async function submitRating(
  recipeId: string,
  rating: number,
): Promise<RatingSummary> {
  const response = await fetch("/api/ratings", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ recipeId, rating }),
  });
  const result = await readResponse(response, isRatingResult);
  return result.summary;
}
