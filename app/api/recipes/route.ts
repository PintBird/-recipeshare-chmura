import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { getNeonClient } from "@/lib/neon";
import { getSupabaseClient } from "@/lib/supabase";
import {
  isRecipeInput,
  makeRecipe,
  validateRecipeInput,
} from "@/lib/recipes";
import {
  toRecipe,
  toRecipeWithSummary,
  type RecipeDatabaseRow,
  type RecipeWithSummaryDatabaseRow,
} from "@/lib/recipeMapping";
import { getUserDisplayName } from "@/lib/user";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const sql = getNeonClient();
    const rows = await sql`
      SELECT
        recipes.id::text,
        recipes.owner_id::text,
        recipes.author_name,
        recipes.title,
        recipes.cuisine,
        recipes.category,
        recipes.ingredients,
        recipes.steps,
        recipes.prep_time_minutes,
        recipes.image_url,
        recipes.created_at::text,
        summaries.average_rating,
        COALESCE(summaries.rating_count, 0)::integer AS rating_count
      FROM public.recipes AS recipes
      LEFT JOIN public.recipe_rating_summaries AS summaries
        ON summaries.recipe_id = recipes.id
      ORDER BY recipes.created_at DESC
    ` as RecipeWithSummaryDatabaseRow[];

    return NextResponse.json(rows.map(toRecipeWithSummary));
  } catch (error) {
    console.error("Could not load recipes from Neon.", error);
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
    const sql = getNeonClient();
    const [data] = await sql`
      INSERT INTO public.recipes (
        id, owner_id, author_name, title, cuisine, category, ingredients,
        steps, prep_time_minutes, image_url
      ) VALUES (
        ${recipe.id}::uuid,
        ${user.id}::uuid,
        ${recipe.authorName},
        ${recipe.title},
        ${recipe.cuisine},
        ${recipe.category},
        ${JSON.stringify(recipe.ingredients)}::jsonb,
        ${JSON.stringify(recipe.steps)}::jsonb,
        ${recipe.prepTimeMinutes},
        ${recipe.imageUrl}
      )
      RETURNING
        id::text,
        owner_id::text,
        author_name,
        title,
        cuisine,
        category,
        ingredients,
        steps,
        prep_time_minutes,
        image_url,
        created_at::text
    ` as RecipeDatabaseRow[];

    if (!data) throw new Error("The database did not return the saved recipe.");
    return NextResponse.json(toRecipe(data), { status: 201 });
  } catch (error) {
    console.error("Could not save recipe to Neon.", error);
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
