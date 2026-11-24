import { NextResponse } from "next/server";
import { getSupabaseClient } from "@/lib/supabase";
import { isRecipeInput, validateRecipeInput } from "@/lib/recipes";
import { toRecipe } from "@/lib/recipeMapping";

type RouteContext = { params: Promise<{ id: string }> };

async function getOwner(
  recipeId: string,
  userId: string,
  supabase: Awaited<ReturnType<typeof getSupabaseClient>>,
) {
  const { data, error } = await supabase
    .from("recipes")
    .select("id, owner_id")
    .eq("id", recipeId)
    .maybeSingle();
  if (error) throw error;
  if (!data) return { status: 404 as const };
  if (data.owner_id !== userId) return { status: 403 as const };
  return { status: 200 as const };
}

export async function PATCH(request: Request, context: RouteContext) {
  const { id } = await context.params;
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

    const ownership = await getOwner(id, user.id, supabase);
    if (ownership.status !== 200) {
      return NextResponse.json(
        { error: ownership.status === 404 ? "Recipe not found." : "You can only edit your own recipes." },
        { status: ownership.status },
      );
    }

    const { data, error } = await supabase
      .from("recipes")
      .update({
        title: input.title.trim(),
        cuisine: input.cuisine,
        category: input.category,
        ingredients: input.ingredients.split(/\r?\n/).map((item) => item.trim()).filter(Boolean),
        steps: input.steps.split(/\r?\n/).map((step) => step.trim()).filter(Boolean),
        prep_time_minutes: Number(input.prepTimeMinutes),
        image_url: input.imageUrl.trim(),
      })
      .eq("id", id)
      .eq("owner_id", user.id)
      .select("id, owner_id, author_name, title, cuisine, category, ingredients, steps, prep_time_minutes, image_url, created_at")
      .single();
    if (error) throw error;

    const { data: summary, error: summaryError } = await supabase
      .from("recipe_rating_summaries")
      .select("average_rating, rating_count")
      .eq("recipe_id", id)
      .maybeSingle();
    if (summaryError) throw summaryError;

    return NextResponse.json(toRecipe(data, summary ? {
      averageRating: summary.average_rating,
      ratingCount: summary.rating_count,
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
  try {
    const supabase = await getSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError) throw authError;
    if (!user) {
      return NextResponse.json({ error: "Sign in to delete a recipe." }, { status: 401 });
    }

    const ownership = await getOwner(id, user.id, supabase);
    if (ownership.status !== 200) {
      return NextResponse.json(
        { error: ownership.status === 404 ? "Recipe not found." : "You can only delete your own recipes." },
        { status: ownership.status },
      );
    }

    const { error } = await supabase
      .from("recipes")
      .delete()
      .eq("id", id)
      .eq("owner_id", user.id);
    if (error) throw error;
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("Could not delete recipe.", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not delete the recipe." },
      { status: 500 },
    );
  }
}
