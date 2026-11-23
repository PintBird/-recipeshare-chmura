"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CATEGORIES,
  CUISINES,
  validateRecipeInput,
} from "@/lib/recipes";
import type { RecipeFieldErrors, RecipeInput } from "@/lib/recipes";
import { createRecipe } from "@/lib/clientApi";

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
  imageUrl: "Image URL",
};

export default function RecipeForm() {
  const router = useRouter();
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState<RecipeFieldErrors>({});
  const [saveError, setSaveError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  function updateField(field: keyof RecipeInput, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
    setSaveError("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const validationErrors = validateRecipeInput(form);
    setErrors(validationErrors);
    setSaveError("");
    if (Object.keys(validationErrors).length > 0) {
      const firstInvalidField = Object.keys(validationErrors)[0];
      document.getElementById(firstInvalidField)?.focus();
      return;
    }

    setIsSubmitting(true);
    try {
      await createRecipe(form);
      router.push("/");
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "Your recipe could not be saved.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="recipe-form" onSubmit={handleSubmit} noValidate>
      <div className="form-section-title"><span>01</span><h2>The basics</h2></div>
      <div className="form-row">
        <label className="form-field">
          <span>Your name</span>
          <input id="authorName" value={form.authorName} onChange={(event) => updateField("authorName", event.target.value)} aria-invalid={Boolean(errors.authorName)} aria-describedby={errors.authorName ? "authorName-error" : undefined} placeholder="e.g. Jamie Lee" />
          {errors.authorName && <span className="field-error" id="authorName-error">{errors.authorName}</span>}
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
          <span>Image URL <small>Link to a food photo</small></span>
          <input id="imageUrl" type="url" value={form.imageUrl} onChange={(event) => updateField("imageUrl", event.target.value)} aria-invalid={Boolean(errors.imageUrl)} aria-describedby={errors.imageUrl ? "imageUrl-error" : undefined} placeholder="https://..." />
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
        {isSubmitting ? "Saving…" : "Add your recipe"} {!isSubmitting && <span aria-hidden="true">↗</span>}
      </button>
    </form>
  );
}
