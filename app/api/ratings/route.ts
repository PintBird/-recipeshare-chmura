import { NextResponse } from "next/server";
import { getSupabaseClient } from "@/lib/supabase";
import { isRatingValue } from "@/lib/ratings";

function isRatingRequest(
  value: unknown,
): value is { recipeId: string; rating: number } {
  if (typeof value !== "object" || value === null) return false;
  const request = value as Record<string, unknown>;
  return (
    typeof request.recipeId === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      request.recipeId,
    ) &&
    isRatingValue(request.rating)
  );
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Request body must be valid JSON." },
      { status: 400 },
    );
  }

  if (!isRatingRequest(body)) {
    return NextResponse.json(
      { error: "Choose a rating from 1 to 5 for a valid recipe." },
      { status: 400 },
    );
  }

  try {
    const supabase = await getSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError) throw authError;
    if (!user) {
      return NextResponse.json({ error: "Sign in to rate a recipe." }, { status: 401 });
    }

    const { data: recipe, error: recipeError } = await supabase
      .from("recipes")
      .select("id, owner_id")
      .eq("id", body.recipeId)
      .maybeSingle();

    if (recipeError) throw recipeError;
    if (!recipe) {
      return NextResponse.json({ error: "Recipe not found." }, { status: 404 });
    }
    if (recipe.owner_id === user.id) {
      return NextResponse.json(
        { error: "You cannot rate your own recipe." },
        { status: 403 },
      );
    }

    const { error: upsertError } = await supabase.from("ratings").upsert(
      {
        recipe_id: body.recipeId,
        user_id: user.id,
        rating: body.rating,
      },
      { onConflict: "recipe_id,user_id" },
    );
    if (upsertError) throw upsertError;

    const { data: summary, error: summaryError } = await supabase
      .from("recipe_rating_summaries")
      .select("average_rating, rating_count")
      .eq("recipe_id", body.recipeId)
      .single();
    if (summaryError) throw summaryError;

    return NextResponse.json({
      summary: {
        averageRating: summary.average_rating,
        ratingCount: summary.rating_count,
      },
    });
  } catch (error) {
    console.error("Could not save recipe rating to Supabase.", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Could not save your rating to the database.",
      },
      { status: 500 },
    );
  }
}
