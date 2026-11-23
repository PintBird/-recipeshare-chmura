# RecipeShare Build Plan

## 1. Scaffold and prepare deployment
- **Covers:** E1, E2, E5, E6
- **Files:** `package.json`, `app/layout.tsx`, `app/page.tsx`, `.env.example`, `README.md`
- **Test:** Add a smoke test that the home page renders.
- **Check:** Run `npm install`, `npm test`, and `npm run build`; push to `main` and verify Vercel serves a live placeholder page.

## 2. Configure Supabase and the data model
- **Covers:** M6
- **Files:** `lib/supabase.ts`, `supabase/schema.sql`, `.env.example`
- **Test:** Add a test that verifies the recipe and rating data structures.
- **Check:** Add environment variables in Vercel and confirm the app can read a recipe from Supabase.

## 3. Build recipe cards
- **Covers:** M1
- **Files:** `app/page.tsx`, `components/RecipeCard.tsx`, `lib/recipes.ts`
- **Test:** Verify that a card includes photo, title, cuisine, category, average rating, and rating count.
- **Check:** Load the deployed home page and confirm a recipe card displays.

## 4. Add recipe details
- **Covers:** M2
- **Files:** `app/recipes/[id]/page.tsx`, `lib/recipes.ts`
- **Test:** Verify that recipe details and the author name are returned for a recipe ID.
- **Check:** Open a card and confirm the detail page shows every recipe field.

## 5. Add recipe creation and validation
- **Covers:** M3
- **Files:** `app/add/page.tsx`, `app/api/recipes/route.ts`, `lib/validation.ts`
- **Test:** Verify that missing required fields return the field names and create no record.
- **Check:** Submit a complete recipe and confirm it appears; then submit missing fields and confirm no save occurs.

## 6. Add cuisine and category filtering
- **Covers:** M4
- **Files:** `app/page.tsx`, `components/RecipeFilters.tsx`, `lib/recipes.ts`
- **Test:** Verify combined Iranian/Main Dish filtering and the no-results state.
- **Check:** Select Iranian and Main Dish, clear choices, and confirm an empty-filter result shows all recipes.

## 7. Add ratings
- **Covers:** M5
- **Files:** `app/recipes/[id]/page.tsx`, `app/api/ratings/route.ts`, `lib/ratings.ts`
- **Test:** Verify average and rating counts, including a rating changing an existing average.
- **Check:** Submit 1-star and 5-star ratings and confirm the detail page and card totals update.

## 8. Verify persistent shared data
- **Covers:** M6
- **Files:** Supabase migrations and all database access modules
- **Test:** Verify that created recipes and ratings persist through separate requests.
- **Check:** Create or rate a recipe, open the deployed app from another device, and redeploy before checking again.

## 9. Add at least two sample recipes
- **Covers:** M7
- **Files:** `supabase/seed.sql`
- **Test:** Verify that seeded recipes use different cuisines and categories.
- **Check:** After deployment, confirm both samples appear and can be used for filter testing.

## 10. Finish CI and documentation
- **Covers:** E3,