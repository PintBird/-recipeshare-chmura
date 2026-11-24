import type { Recipe } from "@/lib/recipes";
import type { RatingSummary } from "@/lib/ratings";

export type RecipeDatabaseRow = {
  id: string;
  owner_id: string | null;
  author_name: string;
  title: string;
  cuisine: Recipe["cuisine"];
  category: Recipe["category"];
  ingredients: string[];
  steps: string[];
  prep_time_minutes: number;
  image_url: string;
  created_at: string;
};

export type RecipeWithSummaryDatabaseRow = RecipeDatabaseRow & {
  average_rating: number | null;
  rating_count: number;
};

const EMPTY_RATING_SUMMARY: RatingSummary = {
  averageRating: 0,
  ratingCount: 0,
};

export function toRecipe(
  row: RecipeDatabaseRow,
  summary: RatingSummary = EMPTY_RATING_SUMMARY,
): Recipe {
  return {
    id: row.id,
    ownerId: row.owner_id,
    authorName: row.author_name,
    title: row.title,
    cuisine: row.cuisine,
    category: row.category,
    ingredients: row.ingredients,
    steps: row.steps,
    prepTimeMinutes: row.prep_time_minutes,
    imageUrl: row.image_url,
    createdAt: row.created_at,
    ...summary,
  };
}

export function toRecipeWithSummary(row: RecipeWithSummaryDatabaseRow): Recipe {
  return toRecipe(row, {
    averageRating: Number(row.average_rating ?? 0),
    ratingCount: Number(row.rating_count),
  });
}
