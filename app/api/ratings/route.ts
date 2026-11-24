import { NextResponse } from "next/server";
import { getNeonClient } from "@/lib/neon";
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

    const sql = getNeonClient();
    const [recipe] = await sql`
      SELECT owner_id::text
      FROM public.recipes
      WHERE id = ${body.recipeId}::uuid
    ` as { owner_id: string | null }[];
    if (!recipe) {
      return NextResponse.json({ error: "Recipe not found." }, { status: 404 });
    }
    if (recipe.owner_id === user.id) {
      return NextResponse.json(
        { error: "You cannot rate your own recipe." },
        { status: 403 },
      );
    }

    await sql`
      INSERT INTO public.ratings (recipe_id, user_id, rating)
      VALUES (${body.recipeId}::uuid, ${user.id}::uuid, ${body.rating})
      ON CONFLICT (recipe_id, user_id)
      DO UPDATE SET rating = EXCLUDED.rating
    `;

    const [summary] = await sql`
      SELECT average_rating, rating_count
      FROM public.recipe_rating_summaries
      WHERE recipe_id = ${body.recipeId}::uuid
    ` as { average_rating: number; rating_count: number }[];
    if (!summary) throw new Error("The database did not return the rating summary.");

    return NextResponse.json({
      summary: {
        averageRating: Number(summary.average_rating),
        ratingCount: Number(summary.rating_count),
      },
    });
  } catch (error) {
    console.error("Could not save recipe rating to Neon.", error);
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
