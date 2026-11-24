"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { fetchRecipes } from "@/lib/clientApi";
import { CUISINES, CATEGORIES, filterRecipes, sortRecipes } from "@/lib/recipes";
import type { RecipeSort } from "@/lib/recipes";
import type { Recipe } from "@/lib/recipes";
import { isRatingSummary } from "@/lib/ratings";

function RecipeCard({ recipe }: { recipe: Recipe }) {
  return (
    <Link className="recipe-card" href={`/recipes/${recipe.id}`}>
      <div className="card-image-wrap">
        <img className="card-image" src={recipe.imageUrl} alt={recipe.title} />
        <span className="card-category">{recipe.category}</span>
      </div>
      <div className="card-content">
        <p className="card-cuisine">{recipe.cuisine}</p>
        <h3>{recipe.title}</h3>
        <div className="card-meta">
          <span className="rating"><span aria-hidden="true">★</span> {recipe.averageRating > 0 ? recipe.averageRating.toFixed(1) : "New"}</span>
          <span>{recipe.ratingCount} {recipe.ratingCount === 1 ? "rating" : "ratings"}</span>
          <span className="card-time">{recipe.prepTimeMinutes} min</span>
        </div>
      </div>
    </Link>
  );
}

export default function HomePage() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [cuisine, setCuisine] = useState("");
  const [category, setCategory] = useState("");
  const [keyword, setKeyword] = useState("");
  const [sort, setSort] = useState<RecipeSort>("newest");
  const [error, setError] = useState("");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let active = true;
    fetchRecipes()
      .then((items) => {
        if (active) setRecipes(items);
      })
      .catch((loadError: unknown) => {
        if (active) {
          setError(loadError instanceof Error ? loadError.message : "Recipes could not be loaded.");
        }
      })
      .finally(() => {
        if (active) setLoaded(true);
      });
    function handleRatingUpdate(event: Event) {
      if (!(event instanceof CustomEvent)) return;
      const detail: unknown = event.detail;
      if (
        typeof detail !== "object" ||
        detail === null ||
        !("recipeId" in detail) ||
        typeof detail.recipeId !== "string" ||
        !("summary" in detail) ||
        !isRatingSummary(detail.summary)
      ) {
        return;
      }

      const recipeId = detail.recipeId;
      const summary = detail.summary;
      setRecipes((current) =>
        current.map((recipe) =>
          recipe.id === recipeId
            ? { ...recipe, ...summary }
            : recipe,
        ),
      );
    }

    window.addEventListener("recipe-rating-updated", handleRatingUpdate);
    return () => {
      active = false;
      window.removeEventListener("recipe-rating-updated", handleRatingUpdate);
    };
  }, []);

  const visibleRecipes = sortRecipes(
    filterRecipes(recipes, cuisine, category, keyword),
    sort,
  );

  return (
    <main>
      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow"><span className="eyebrow-line" /> A little taste of everywhere</p>
          <h1>Good food brings<br />us <em>together.</em></h1>
          <p className="hero-description">Recipes passed around, cooked with love, and made your own. Find something delicious to make today.</p>
          <Link className="button button-dark" href="/add">Share your recipe <span aria-hidden="true">↗</span></Link>
        </div>
        <div className="hero-art" aria-hidden="true">
          <div className="hero-photo">
            <img src="https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=1400&q=90" alt="" />
          </div>
          <div className="hero-note"><span className="note-star">✳</span><span>Made to be<br />shared.</span></div>
          <div className="hero-stamp">FROM<br />OUR<br />KITCHENS</div>
        </div>
      </section>

      <section className="recipes-section" aria-labelledby="recipes-heading">
        <div className="section-heading">
          <div>
            <p className="eyebrow">The community table</p>
            <h2 id="recipes-heading">Find your next <em>favorite.</em></h2>
          </div>
          <p className="recipe-count">{loaded ? `${visibleRecipes.length} ${visibleRecipes.length === 1 ? "recipe" : "recipes"}` : "Loading recipes…"}</p>
        </div>
        <div className="filters" aria-label="Filter recipes">
          <label className="keyword-filter">
            <span className="filter-label">Search</span>
            <input
              type="search"
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              placeholder="Recipe or ingredient"
              aria-label="Search recipes by title or ingredient"
            />
          </label>
          <label>
            <span className="filter-label">Cuisine</span>
            <select value={cuisine} onChange={(event) => setCuisine(event.target.value)}>
              <option value="">All cuisines</option>
              {CUISINES.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </label>
          <label>
            <span className="filter-label">Category</span>
            <select value={category} onChange={(event) => setCategory(event.target.value)}>
              <option value="">All categories</option>
              {CATEGORIES.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </label>
          <label>
            <span className="filter-label">Sort by</span>
            <select value={sort} onChange={(event) => setSort(event.target.value as RecipeSort)}>
              <option value="newest">Newest</option>
              <option value="highest-rated">Highest rated</option>
            </select>
          </label>
          {(cuisine || category || keyword) && (
            <button className="clear-filters" type="button" onClick={() => { setCuisine(""); setCategory(""); setKeyword(""); }}>
              Clear filters <span aria-hidden="true">×</span>
            </button>
          )}
        </div>

        {error ? (
          <p className="status-message error-message" role="alert">{error}</p>
        ) : !loaded ? (
          <p className="status-message">Loading recipes…</p>
        ) : visibleRecipes.length > 0 ? (
          <div className="recipe-grid">
            {visibleRecipes.map((recipe) => <RecipeCard key={recipe.id} recipe={recipe} />)}
          </div>
        ) : (
          <div className="empty-state">
            <span className="empty-icon" aria-hidden="true">⌕</span>
            <h3>No recipes found</h3>
            <p>Try changing your filters to find something tasty.</p>
          </div>
        )}
      </section>
    </main>
  );
}
