# CLAUDE.md

## Purpose

RecipeShare is a visitor-facing recipe website that allows users to browse, search, add, and rate recipes. It must store recipes and ratings in a persistent shared database.

Treat `docs/spec.md` as the source of truth for requirements and acceptance criteria.

## Stack

- Next.js
- React
- TypeScript
- Neon PostgreSQL (recipes and ratings)
- Supabase Auth (for the Google sign-in features)
- Supabase Storage (for persistent recipe images)
- Vercel hosting
- GitHub Actions for CI

## Commands

After the project is scaffolded, use:

- Install dependencies: `npm install`
- Run locally: `npm run dev`
- Run tests: `npm test`
- Build: `npm run build`
- Start the production build: `npm start`

Keep all test and build commands usable through those simple npm scripts.

## Coding Conventions

- Use TypeScript for application code.
- Prefer small, typed components and server-side functions.
- Validate required form fields before saving data.
- Use fixed cuisine and category values defined in `docs/spec.md`; never allow free-text values for those fields.
- Keep API/database access in clearly named server modules or route handlers.
- Use descriptive variable and function names.
- Follow existing formatting and linting conventions.
- Keep secrets out of source code, logs, examples, and commit history.
- Read secrets from environment variables.
- Document environment-variable names in `.env.example` without values.
- Never commit `.env`, credentials, private keys, database passwords, or tokens.
- Build Must features before Should features.
- Implement and verify one feature before moving to the next.

## Testing Rules

- Add a test for each feature once it works.
- At least three focused passing tests must cover different requirements, such as filtering, average ratings, and required fields.
- Tests must run with one command.
- CI must run tests and a build for every push.
- GitHub Actions must be configured to run without repository secrets; deployment secrets belong in Vercel environment variables.

## Deployment

- Deploy to Vercel with automatic deployment from the `main` branch.
- Use only free plans for the application and database services.
- Do not add payments, administration, or email functionality.
- Recipes and ratings must remain available after redeployment.

## Workflow

1. Read `docs/spec.md` before planning or implementation.
2. Create `docs/plan.md` before coding.
3. Implement Must features first.
4. Add a test after each feature passes.
5. Commit and push clear, focused changes frequently.
6. Keep `README.md` updated with the live URL, run instructions, test instructions, and the M/S/Could checklist.