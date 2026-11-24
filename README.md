# RecipeShare

A recipe-sharing app built with Next.js, TypeScript, and React.

## Database and service setup

Create a free Neon database from your Vercel project's **Storage** tab and connect it to the project. Vercel's Neon integration supplies the private `DATABASE_URL` environment variable. For local development, copy `.env.example` to `.env.local` and add the Neon connection string as `DATABASE_URL`. Never expose it with a `NEXT_PUBLIC_` prefix or commit the local environment file.

In the Neon SQL Editor, run `neon/schema.sql` and then `neon/seed.sql`. This creates the recipes and ratings tables, ownership and rating constraints, and four sample recipes across different cuisines and categories. The seed script is safe to run again.

Supabase is still used for Google sign-in and persistent recipe-image uploads; Neon stores all recipe and rating records. Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in `.env.local` and in Vercel. In Supabase Authentication, enable Google and configure its OAuth client credentials. Set the Google callback URL to the Supabase project's `/auth/v1/callback`, then add the app's local and deployed `/auth/callback` URLs to Supabase's redirect URL allowlist. Keep the Google client secret in Supabase, not in this repository.

Run `supabase/schema.sql` in the Supabase SQL Editor to create the public `recipe-images` bucket and owner-scoped upload policies. Recipe changes are authorized by server API routes after verifying the Supabase sign-in; Neon also enforces unique user ratings and prevents authors from rating their own recipes. Image uploads are limited to 4 MiB to fit common serverless request limits.

Existing recipe and rating rows in a previous Supabase database are not copied automatically; run the Neon seed script to populate the four starter recipes.

## Run locally

Install dependencies and start the development server:

```sh
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Run the focused unit tests with:

```sh
npm test
```

Create a production build with `npm run build`, then serve it with `npm start`.

## Feature checklist

### Must

- [~] M1: Browse recipe cards with photos, titles, cuisine, category, and average rating (deployment verification pending).
- [~] M2: Open a recipe to read its details and author's name (deployment verification pending).
- [~] M3: Add a recipe with required-field validation (deployment verification pending).
- [~] M4: Filter by cuisine and category, including combined filters and the no-results state (deployment verification pending).
- [~] M5: Submit 1–5 star ratings and update the average and count (deployment verification pending).
- [~] M6: Store recipes and ratings in Neon for shared, persistent access (requires project configuration).
- [~] M7: Seed four sample recipes in Neon with distinct cuisines and categories (requires running the seed SQL).

### Should

- [~] S1: Google sign-in, sign-out, author names, and a recipe profile (Google configuration required).
- [~] S2: Edit and delete own recipes (server verifies recipe ownership).
- [~] S3: Signed-in ratings, one rating per user/recipe, and no author self-ratings (Neon constraints and server checks).
- [~] S4: Persistent recipe-photo uploads (Supabase Storage setup required).
- [x] S5: Keyword search by recipe title and ingredients, combined with filters.
- [x] S6: Sort by newest or highest rated.

### Could

- [ ] Comments.
- [ ] Favorites.
- [ ] Servings scaler.
- [ ] Recipe video.
- [ ] Dietary tags.
- [x] Phone-friendly layout.

## Data and deployment

Recipes and ratings are read from and written to Neon through server API routes. The Neon connection string must be set as `DATABASE_URL` in the local environment and Vercel. Google sign-in and image uploads continue to use Supabase and require its environment variables, Google OAuth setup, and storage schema. The repository includes Neon schema and seed scripts; run them in the Neon SQL Editor before using the app.
