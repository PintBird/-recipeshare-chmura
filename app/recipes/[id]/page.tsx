"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { fetchRecipes, submitRating } from "@/lib/clientApi";
import type { Recipe } from "@/lib/recipes";

export default function RecipeDetailPage() {
  const params = useParams<{ id: string }>();
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [error, setError] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [selectedRating, setSelectedRating] = useState(0);
  const [isSubmittingRating, setIsSubmittingRating] = useState(false);
  const [ratingMessage, setRatingMessage] = useState("");
  const [ratingError, setRatingError] = useState("");

  useEffect(() => {
    let active = true;
    fetchRecipes()
      .then((items) => {
        if (active) setRecipe(items.find((item) => item.id === params.id) ?? null);
      })
      .catch((loadError: unknown) => {
        if (active) {
          setError(loadError instanceof Error ? loadError.message : "Recipe could not be loaded.");
        }
      })
      .finally(() => {
        if (active) setLoaded(true);
      });
    return () => { active = false; };
  }, [params.id]);

  async function rateRecipe() {
    if (!recipe || selectedRating < 1 || selectedRating > 5) return;
    setIsSubmittingRating(true);
    setRatingError("");
    setRatingMessage("");

    try {
      const summary = await submitRating(recipe.id, selectedRating);
      setRecipe((current) => current ? { ...current, ...summary } : current);
      window.dispatchEvent(
        new CustomEvent("recipe-rating-updated", {
          detail: { recipeId: recipe.id, summary },
        }),
      );
      setRatingMessage("Thanks for sharing your rating.");
      setSelectedRating(0);
    } catch (ratingFailure) {
      setRatingError(
        ratingFailure instanceof Error ? ratingFailure.message : "Your rating could not be saved.",
      );
    } finally {
      setIsSubmittingRating(false);
    }
  }

  if (error) {
    return <main className="detail-state"><p className="status-message error-message" role="alert">{error}</p><Link className="text-link" href="/">Back to recipes</Link></main>;
  }
  if (!loaded) return <main className="detail-state"><p className="status-message">Loading recipe…</p></main>;
  if (!recipe) {
    return (
      <main className="detail-state">
        <span className="empty-icon" aria-hidden="true">⌕</span>
        <h1>Recipe not found</h1>
        <p>It may have been removed from this browser.</p>
        <Link className="button button-dark" href="/">Explore recipes</Link>
      </main>
    );
  }

  return (
    <main className="detail-page">
      <Link className="back-link" href="/"><span aria-hidden="true">←</span> All recipes</Link>
      <div className="detail-hero">
        <div className="detail-image-wrap"><img src={recipe.imageUrl} alt={recipe.title} /></div>
        <div className="detail-heading">
          <p className="eyebrow">{recipe.cuisine} <span className="eyebrow-dot">·</span> {recipe.category}</p>
          <h1>{recipe.title}</h1>
          <p className="detail-byline">Shared by <strong>{recipe.authorName}</strong></p>
          <div className="detail-stats">
            <span className="rating"><span aria-hidden="true">★</span> {recipe.averageRating > 0 ? recipe.averageRating.toFixed(1) : "New"}</span>
            <span>{recipe.ratingCount} {recipe.ratingCount === 1 ? "rating" : "ratings"}</span>
            <span>{recipe.prepTimeMinutes} min prep</span>
          </div>
        </div>
      </div>
      <div className="detail-content">
        <section className="ingredients-panel">
          <p className="eyebrow">Gather around</p>
          <h2>What you’ll need</h2>
          <ul className="ingredient-list">
            {recipe.ingredients.map((ingredient, index) => <li key={`${ingredient}-${index}`}>{ingredient}</li>)}
          </ul>
        </section>
        <section className="steps-panel">
          <p className="eyebrow">Let’s make it</p>
          <h2>How it comes together</h2>
          <ol className="step-list">
            {recipe.steps.map((step, index) => <li key={`${step}-${index}`}><span className="step-number">{String(index + 1).padStart(2, "0")}</span><p>{step}</p></li>)}
          </ol>
        </section>
      </div>
      <section className="rating-panel" aria-labelledby="rate-recipe-heading">
        <p className="eyebrow">Cooked this recipe?</p>
        <h2 id="rate-recipe-heading">Leave a rating</h2>
        <div className="star-picker" role="group" aria-label="Choose a rating from 1 to 5 stars">
          {[1, 2, 3, 4, 5].map((rating) => (
            <button
              key={rating}
              className={rating <= selectedRating ? "star-choice selected" : "star-choice"}
              type="button"
              onClick={() => { setSelectedRating(rating); setRatingError(""); setRatingMessage(""); }}
              aria-label={`${rating} ${rating === 1 ? "star" : "stars"}`}
              aria-pressed={selectedRating === rating}
            >
              ★
            </button>
          ))}
        </div>
        <button
          className="button button-dark rating-submit"
          type="button"
          onClick={rateRecipe}
          disabled={selectedRating === 0 || isSubmittingRating}
        >
          {isSubmittingRating ? "Saving…" : "Submit rating"}
        </button>
        {ratingMessage && <p className="rating-feedback" role="status">{ratingMessage}</p>}
        {ratingError && <p className="rating-feedback error-message" role="alert">{ratingError}</p>}
      </section>
    </main>
  );
}
