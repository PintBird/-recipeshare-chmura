import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { getSupabaseClient } from "@/lib/supabase";
import {
  isRecipeInput,
  makeRecipe,
  validateRecipeInput,
} from "@/lib/recipes";
import type { Recipe } from "@/lib/recipes";
import type { RatingSummary } from "@/lib/ratings";

const EMPTY_RATING_SUMMARY: RatingSummary = {
  averageRating: 0,
  ratingCount: 0,
};

export const dynamic = "force-dynamic";

function toRecipe(
  row: {
    id: string;
    author_name: string;
    title: string;
    cuisine: Recipe["cuisine"];
    category: Recipe["category"];
    ingredients: string[];
    steps: string[];
    prep_time_minutes: number;
    image_url: string;
  },
  summary: RatingSummary = EMPTY_RATING_SUMMARY,
): Recipe {
  return {
    id: row.id,
    authorName: row.author_name,
    title: row.title,
    cuisine: row.cuisine,
    category: row.category,
    ingredients: row.ingredients,
    steps: row.steps,
    prepTimeMinutes: row.prep_time_minutes,
    imageUrl: row.image_url,
    ...summary,
  };
}

export async function GET() {
  try {
    const supabase = getSupabaseClient();
    const [recipesResult, summariesResult] = await Promise.all([
      supabase
        .from("recipes")
        .select(
          "id, author_name, title, cuisine, category, ingredients, steps, prep_time_minutes, image_url",
        )
        .order("created_at", { ascending: false }),
      supabase
        .from("recipe_rating_summaries")
        .select("recipe_id, average_rating, rating_count"),
    ]);

    if (recipesResult.error) throw recipesResult.error;
    if (summariesResult.error) throw summariesResult.error;

    const summariesByRecipe = new Map<string, RatingSummary>();
    for (const summary of summariesResult.data) {
      summariesByRecipe.set(summary.recipe_id, {
        averageRating: summary.average_rating,
        ratingCount: summary.rating_count,
      });
    }

    return NextResponse.json(
      recipesResult.data.map((recipe) =>
        toRecipe(recipe, summariesByRecipe.get(recipe.id)),
      ),
    );
  } catch (error) {
    console.error("Could not load recipes from Supabase.", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Could not load recipes from the database.",
      },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  let input: unknown;
  try {
    input = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Request body must be valid JSON." },
      { status: 400 },
    );
  }

  if (!isRecipeInput(input)) {
    return NextResponse.json(
      { error: "All recipe fields are required." },
      { status: 400 },
    );
  }

  const errors = validateRecipeInput(input);
  if (Object.keys(errors).length > 0) {
    return NextResponse.json(
      { error: "Correct the highlighted recipe fields.", errors },
      { status: 400 },
    );
  }

  try {
    const recipe = makeRecipe(randomUUID(), input);
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("recipes")
      .insert({
        id: recipe.id,
        author_name: recipe.authorName,
        title: recipe.title,
        cuisine: recipe.cuisine,
        category: recipe.category,
        ingredients: recipe.ingredients,
        steps: recipe.steps,
        prep_time_minutes: recipe.prepTimeMinutes,
        image_url: recipe.imageUrl,
      })
      .select(
        "id, author_name, title, cuisine, category, ingredients, steps, prep_time_minutes, image_url",
      )
      .single();

    if (error) throw error;
    return NextResponse.json(toRecipe(data), { status: 201 });
  } catch (error) {
    console.error("Could not save recipe to Supabase.", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Could not save the recipe to the database.",
      },
      { status: 500 },
    );
  }
}
