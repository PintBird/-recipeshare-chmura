import RecipeForm from "@/components/RecipeForm";

export default function AddRecipePage() {
  return (
    <main className="form-page">
      <div className="form-intro">
        <p className="eyebrow">Pass it around</p>
        <h1>Share a recipe<br />from your <em>kitchen.</em></h1>
        <p>The best recipes are the ones we share. Tell us how you make yours.</p>
      </div>
      <RecipeForm />
    </main>
  );
}
