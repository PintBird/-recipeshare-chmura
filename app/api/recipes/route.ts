import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { getSupabaseClient } from "@/lib/supabase";
import {
  isRecipeInput,
  makeRecipe,
  validateRecipeInput,
} from "@/lib/recipes";
import type { RatingSummary } from "@/lib/ratings";
import { toRecipe } from "@/lib/recipeMapping";
import { getUserDisplayName } from "@/lib/user";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = await getSupabaseClient();
    const [recipesResult, summariesResult] = await Promise.all([
      supabase
        .from("recipes")
        .select(
          "id, owner_id, author_name, title, cuisine, category, ingredients, steps, prep_time_minutes, image_url, created_at",
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
    const supabase = await getSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError) throw authError;
    if (!user) {
      return NextResponse.json({ error: "Sign in to share a recipe." }, { status: 401 });
    }

    const authorName = getUserDisplayName(user);
    if (!authorName.trim()) {
      return NextResponse.json(
        { error: "Your Google account does not include a name." },
        { status: 400 },
      );
    }

    input.authorName = authorName;
    const recipe = makeRecipe(randomUUID(), input);
    const { data, error } = await supabase
      .from("recipes")
      .insert({
        id: recipe.id,
        owner_id: user.id,
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
        "id, owner_id, author_name, title, cuisine, category, ingredients, steps, prep_time_minutes, image_url, created_at",
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
