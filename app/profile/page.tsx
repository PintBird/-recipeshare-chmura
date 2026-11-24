"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import AuthControls from "@/components/AuthControls";
import { useAuth } from "@/components/AuthProvider";
import { fetchRecipes } from "@/lib/clientApi";
import type { Recipe } from "@/lib/recipes";
import { getUserDisplayName } from "@/lib/user";

export default function ProfilePage() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [callbackError, setCallbackError] = useState("");

  useEffect(() => {
    if (new URLSearchParams(window.location.search).has("authError")) {
      setCallbackError("Google sign-in could not be completed. Please try again.");
    }
  }, []);

  useEffect(() => {
    if (isAuthLoading || !user) return;
    let active = true;
    setIsLoading(true);
    fetchRecipes()
      .then((items) => {
        if (active) setRecipes(items.filter((recipe) => recipe.ownerId === user.id));
      })
      .catch((failure: unknown) => {
        if (active) setError(failure instanceof Error ? failure.message : "Could not load your recipes.");
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => { active = false; };
  }, [isAuthLoading, user]);

  const name = user ? getUserDisplayName(user) : "";

  return (
    <main className="profile-page">
      <p className="eyebrow">Your RecipeShare kitchen</p>
      <h1>{user ? `Hello, ${name}.` : "Your profile."}</h1>
      {isAuthLoading ? (
        <p className="status-message">Checking your sign-in…</p>
      ) : !user ? (
        <div className="sign-in-required">
          <p>Sign in with Google to view the recipes you’ve shared.</p>
          {callbackError && <p className="form-error-summary" role="alert">{callbackError}</p>}
          <AuthControls />
        </div>
      ) : (
        <>
          <div className="profile-heading">
            <h2>Your recipes</h2>
            <Link className="button button-dark" href="/add">Share a recipe <span aria-hidden="true">↗</span></Link>
          </div>
          {error ? (
            <p className="status-message error-message" role="alert">{error}</p>
          ) : isLoading ? (
            <p className="status-message">Loading your recipes…</p>
          ) : recipes.length === 0 ? (
            <div className="empty-state">
              <h3>No recipes yet</h3>
              <p>Share your first recipe with the community.</p>
            </div>
          ) : (
            <div className="recipe-grid">
              {recipes.map((recipe) => (
                <Link className="recipe-card" href={`/recipes/${recipe.id}`} key={recipe.id}>
                  <div className="card-image-wrap"><img className="card-image" src={recipe.imageUrl} alt={recipe.title} /></div>
                  <div className="card-content">
                    <p className="card-cuisine">{recipe.cuisine} · {recipe.category}</p>
                    <h3>{recipe.title}</h3>
                    <div className="card-meta">
                      <span className="rating">★ {recipe.averageRating > 0 ? recipe.averageRating.toFixed(1) : "New"}</span>
                      <span>{recipe.ratingCount} ratings</span>
                      <span className="card-time">View →</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </>
      )}
    </main>
  );
}
