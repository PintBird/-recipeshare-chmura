"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import RecipeForm from "@/components/RecipeForm";
import { useAuth } from "@/components/AuthProvider";
import { fetchRecipes } from "@/lib/clientApi";
import type { Recipe } from "@/lib/recipes";

export default function EditRecipePage() {
  const params = useParams<{ id: string }>();
  const { user, isLoading: isAuthLoading } = useAuth();
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isAuthLoading || !user) {
      setIsLoading(false);
      return;
    }
    let active = true;
    fetchRecipes()
      .then((items) => {
        if (!active) return;
        const found = items.find((item) => item.id === params.id);
        if (!found || found.ownerId !== user.id) {
          setError("You can only edit your own recipes.");
          return;
        }
        setRecipe(found);
      })
      .catch((failure: unknown) => {
        if (active) setError(failure instanceof Error ? failure.message : "Could not load this recipe.");
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => { active = false; };
  }, [isAuthLoading, params.id, user]);

  if (isLoading || isAuthLoading) {
    return <main className="form-page"><p className="status-message">Loading recipe…</p></main>;
  }
  if (!user || error || !recipe) {
    return (
      <main className="detail-state">
        <h1>{error || "Sign in to edit a recipe."}</h1>
        <Link className="text-link" href="/profile">Back to your profile</Link>
      </main>
    );
  }

  return (
    <main className="form-page">
      <div className="form-intro">
        <p className="eyebrow">Your kitchen</p>
        <h1>Make it<br /><em>just right.</em></h1>
        <p>Update your recipe details and save your changes.</p>
      </div>
      <RecipeForm recipe={recipe} />
    </main>
  );
}
