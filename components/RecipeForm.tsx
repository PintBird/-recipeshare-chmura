"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import type { Recipe } from "@/lib/recipes";
import {
  CATEGORIES,
  CUISINES,
  validateRecipeInput,
} from "@/lib/recipes";
import type { RecipeFieldErrors, RecipeInput } from "@/lib/recipes";
import { createRecipe, updateRecipe, uploadRecipeImage } from "@/lib/clientApi";
import { useAuth } from "@/components/AuthProvider";
import AuthControls from "@/components/AuthControls";
import { getUserDisplayName } from "@/lib/user";

const initialForm: RecipeInput = {
  authorName: "",
  title: "",
  cuisine: "",
  category: "",
  ingredients: "",
  steps: "",
  prepTimeMinutes: "",
  imageUrl: "",
};

const fieldLabels: Record<keyof RecipeInput, string> = {
  authorName: "Author name",
  title: "Recipe title",
  cuisine: "Cuisine",
  category: "Category",
  ingredients: "Ingredients",
  steps: "Steps",
  prepTimeMinutes: "Prep time",
  imageUrl: "Recipe photo",
};

function recipeToInput(recipe: Recipe): RecipeInput {
  return {
    authorName: recipe.authorName,
    title: recipe.title,
    cuisine: recipe.cuisine,
    category: recipe.category,
    ingredients: recipe.ingredients.join("\n"),
    steps: recipe.steps.join("\n"),
    prepTimeMinutes: String(recipe.prepTimeMinutes),
    imageUrl: recipe.imageUrl,
  };
}

export default function RecipeForm({ recipe }: { recipe?: Recipe }) {
  const router = useRouter();
  const { user, isLoading: isAuthLoading } = useAuth();
  const [form, setForm] = useState(() => recipe ? recipeToInput(recipe) : initialForm);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<RecipeFieldErrors>({});
  const [saveError, setSaveError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const userName = user ? getUserDisplayName(user) : "";

  function updateField(field: keyof RecipeInput, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
    setSaveError("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user) {
      setSaveError("Sign in with Google before saving a recipe.");
      return;
    }

    const submittedForm = {
      ...form,
      authorName: userName,
      imageUrl: imageFile ? "https://upload-pending.invalid/image" : form.imageUrl,
    };
    const validationErrors = validateRecipeInput(submittedForm);
    setErrors(validationErrors);
    setSaveError("");
    if (Object.keys(validationErrors).length > 0) {
      const firstInvalidField = Object.keys(validationErrors)[0];
      document.getElementById(firstInvalidField)?.focus();
      return;
    }

    setIsSubmitting(true);
    try {
      const imageUrl = imageFile
        ? await uploadRecipeImage(imageFile)
        : form.imageUrl;
      const recipeInput = { ...submittedForm, imageUrl };
      const saved = recipe
        ? await updateRecipe(recipe.id, recipeInput)
        : await createRecipe(recipeInput);
      router.push(recipe ? `/recipes/${saved.id}` : "/");
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "Your recipe could not be saved.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="recipe-form" onSubmit={handleSubmit} noValidate>
      {isAuthLoading ? (
        <p className="status-message">Checking your sign-in…</p>
      ) : !user ? (
        <div className="sign-in-required">
          <p>Sign in with Google to {recipe ? "edit" : "share"} a recipe.</p>
          <AuthControls />
        </div>
      ) : (
      <>
      <div className="form-section-title"><span>01</span><h2>The basics</h2></div>
      <div className="form-row">
        <label className="form-field">
          <span>Your name</span>
          <input id="authorName" value={userName} readOnly aria-readonly="true" />
        </label>
        <label className="form-field">
          <span>Recipe title</span>
          <input id="title" value={form.title} onChange={(event) => updateField("title", event.target.value)} aria-invalid={Boolean(errors.title)} aria-describedby={errors.title ? "title-error" : undefined} placeholder="e.g. Sunday tomato pasta" />
          {errors.title && <span className="field-error" id="title-error">{errors.title}</span>}
        </label>
      </div>

      <div className="form-row">
        <label className="form-field">
          <span>Cuisine</span>
          <select id="cuisine" value={form.cuisine} onChange={(event) => updateField("cuisine", event.target.value)} aria-invalid={Boolean(errors.cuisine)} aria-describedby={errors.cuisine ? "cuisine-error" : undefined}>
            <option value="">Choose a cuisine</option>
            {CUISINES.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
          {errors.cuisine && <span className="field-error" id="cuisine-error">{errors.cuisine}</span>}
        </label>
        <label className="form-field">
          <span>Category</span>
          <select id="category" value={form.category} onChange={(event) => updateField("category", event.target.value)} aria-invalid={Boolean(errors.category)} aria-describedby={errors.category ? "category-error" : undefined}>
            <option value="">Choose a category</option>
            {CATEGORIES.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
          {errors.category && <span className="field-error" id="category-error">{errors.category}</span>}
        </label>
      </div>

      <div className="form-section-title form-section-spaced"><span>02</span><h2>Make it yours</h2></div>
      <label className="form-field">
        <span>Ingredients <small>One ingredient per line</small></span>
        <textarea id="ingredients" rows={5} value={form.ingredients} onChange={(event) => updateField("ingredients", event.target.value)} aria-invalid={Boolean(errors.ingredients)} aria-describedby={errors.ingredients ? "ingredients-error" : undefined} placeholder={"2 cups all-purpose flour\n1 cup whole milk\n2 large eggs"} />
        {errors.ingredients && <span className="field-error" id="ingredients-error">{errors.ingredients}</span>}
      </label>
      <label className="form-field">
        <span>Steps <small>One step per line</small></span>
        <textarea id="steps" rows={5} value={form.steps} onChange={(event) => updateField("steps", event.target.value)} aria-invalid={Boolean(errors.steps)} aria-describedby={errors.steps ? "steps-error" : undefined} placeholder={"Whisk the dry ingredients together.\nAdd milk and eggs, then stir until smooth.\nCook in a hot pan until golden."} />
        {errors.steps && <span className="field-error" id="steps-error">{errors.steps}</span>}
      </label>

      <div className="form-row final-form-row">
        <label className="form-field">
          <span>Prep time <small>in minutes</small></span>
          <input id="prepTimeMinutes" type="number" min="1" step="1" value={form.prepTimeMinutes} onChange={(event) => updateField("prepTimeMinutes", event.target.value)} aria-invalid={Boolean(errors.prepTimeMinutes)} aria-describedby={errors.prepTimeMinutes ? "prepTimeMinutes-error" : undefined} placeholder="30" />
          {errors.prepTimeMinutes && <span className="field-error" id="prepTimeMinutes-error">{errors.prepTimeMinutes}</span>}
        </label>
        <label className="form-field">
          <span>Recipe photo <small>JPEG, PNG, WebP, or GIF; up to 4 MiB</small></span>
          <input
            id="imageUrl"
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={(event) => {
              const file = event.target.files?.[0] ?? null;
              setImageFile(file);
              setErrors((current) => ({ ...current, imageUrl: undefined }));
              setSaveError("");
            }}
            aria-invalid={Boolean(errors.imageUrl)}
            aria-describedby={errors.imageUrl ? "imageUrl-error" : undefined}
          />
          {recipe && !imageFile && <span className="image-current">Current photo will be kept unless you choose another.</span>}
          {errors.imageUrl && <span className="field-error" id="imageUrl-error">{errors.imageUrl}</span>}
        </label>
      </div>

      {Object.keys(errors).length > 0 && (
        <p className="form-error-summary" role="alert">
          Please check these fields: {Object.keys(errors).map((field) => fieldLabels[field as keyof RecipeInput]).join(", ")}.
        </p>
      )}
      {saveError && <p className="form-error-summary" role="alert">{saveError}</p>}
      <button className="button button-dark form-submit" type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Saving…" : recipe ? "Save changes" : "Add your recipe"} {!isSubmitting && <span aria-hidden="true">↗</span>}
      </button>
      </>
      )}
    </form>
  );
}
