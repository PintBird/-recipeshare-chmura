# RecipeShare

A recipe-sharing app built with Next.js, TypeScript, and React.

## Supabase setup

Create a Supabase project, then run `supabase/schema.sql` and `supabase/seed.sql` in the Supabase SQL Editor (in that order). This creates the public recipes and ratings tables, enables row-level security, and seeds four recipes across different cuisines and categories.

Copy `.env.example` to `.env.local` and set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` from the Supabase project settings. The anon key is used only with row-level policies; never put a service-role key in the app.

In Supabase Authentication, enable Google and configure its OAuth client credentials. Set the Google callback URL to the Supabase project's `/auth/v1/callback`, then add the app's local and deployed `/auth/callback` URLs to Supabase's redirect URL allowlist. Keep the Google client secret in Supabase, not in this repository.

The schema grants recipe writes only to signed-in owners, enforces one rating per signed-in user and recipe, prevents authors rating their own recipes, and creates the public `recipe-images` bucket for owner-scoped uploads. Applying the schema upgrades the earlier visitor-only policies; existing anonymous ratings are retained but excluded from the average, while all new ratings require Google sign-in. Image uploads are limited to 4 MiB to fit common serverless request limits.

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
- [~] M6: Store recipes and ratings in Supabase for shared, persistent access (requires project configuration).
- [~] M7: Seed four sample recipes in Supabase with distinct cuisines and categories (requires project setup).

### Should

- [~] S1: Google sign-in, sign-out, author names, and a recipe profile (Google configuration required).
- [~] S2: Edit and delete own recipes (Supabase schema required to enforce ownership).
- [~] S3: Signed-in ratings, one rating per user/recipe, and no author self-ratings (Supabase schema required).
- [~] S4: Persistent recipe-photo uploads (Supabase storage setup required).
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

Recipes and ratings are read from and written to Supabase through server API routes. The Google sign-in, ownership protections, and image uploads require applying the supplied schema and configuring Google OAuth. Seed data can be loaded by running the supplied SQL script. No live database or app deployment is configured in this repository yet.
