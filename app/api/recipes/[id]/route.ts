import { NextResponse } from "next/server";
import { getNeonClient } from "@/lib/neon";
import { getSupabaseClient } from "@/lib/supabase";
import { isRecipeInput, validateRecipeInput } from "@/lib/recipes";
import { toRecipe, type RecipeDatabaseRow } from "@/lib/recipeMapping";

type RouteContext = { params: Promise<{ id: string }> };

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

async function getOwner(recipeId: string, userId: string) {
  const sql = getNeonClient();
  const [data] = await sql`
    SELECT owner_id::text
    FROM public.recipes
    WHERE id = ${recipeId}::uuid
  `;
  if (!data) return { status: 404 as const };
  if (data.owner_id !== userId) return { status: 403 as const };
  return { status: 200 as const };
}

export async function PATCH(request: Request, context: RouteContext) {
  const { id } = await context.params;
  if (!UUID_PATTERN.test(id)) {
    return NextResponse.json({ error: "Recipe not found." }, { status: 404 });
  }
  let input: unknown;
  try {
    input = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }
  if (!isRecipeInput(input)) {
    return NextResponse.json({ error: "All recipe fields are required." }, { status: 400 });
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
      return NextResponse.json({ error: "Sign in to edit a recipe." }, { status: 401 });
    }

    const ownership = await getOwner(id, user.id);
    if (ownership.status !== 200) {
      return NextResponse.json(
        { error: ownership.status === 404 ? "Recipe not found." : "You can only edit your own recipes." },
        { status: ownership.status },
      );
    }

    const sql = getNeonClient();
    const [data] = await sql`
      UPDATE public.recipes
      SET
        title = ${input.title.trim()},
        cuisine = ${input.cuisine},
        category = ${input.category},
        ingredients = ${JSON.stringify(input.ingredients.split(/\r?\n/).map((item) => item.trim()).filter(Boolean))}::jsonb,
        steps = ${JSON.stringify(input.steps.split(/\r?\n/).map((step) => step.trim()).filter(Boolean))}::jsonb,
        prep_time_minutes = ${Number(input.prepTimeMinutes)},
        image_url = ${input.imageUrl.trim()}
      WHERE id = ${id}::uuid AND owner_id = ${user.id}::uuid
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
    if (!data) throw new Error("The database did not return the updated recipe.");

    const [summary] = await sql`
      SELECT average_rating, rating_count
      FROM public.recipe_rating_summaries
      WHERE recipe_id = ${id}::uuid
    ` as { average_rating: number; rating_count: number }[];

    return NextResponse.json(toRecipe(data, summary ? {
      averageRating: Number(summary.average_rating),
      ratingCount: Number(summary.rating_count),
    } : undefined));
  } catch (error) {
    console.error("Could not update recipe.", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not update the recipe." },
      { status: 500 },
    );
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  if (!UUID_PATTERN.test(id)) {
    return NextResponse.json({ error: "Recipe not found." }, { status: 404 });
  }
  try {
    const supabase = await getSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError) throw authError;
    if (!user) {
      return NextResponse.json({ error: "Sign in to delete a recipe." }, { status: 401 });
    }

    const ownership = await getOwner(id, user.id);
    if (ownership.status !== 200) {
      return NextResponse.json(
        { error: ownership.status === 404 ? "Recipe not found." : "You can only delete your own recipes." },
        { status: ownership.status },
      );
    }

    const sql = getNeonClient();
    await sql`
      DELETE FROM public.recipes
      WHERE id = ${id}::uuid AND owner_id = ${user.id}::uuid
    `;
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("Could not delete recipe.", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not delete the recipe." },
      { status: 500 },
    );
  }
}
