create table if not exists public.recipes (
  id uuid primary key default gen_random_uuid(),
  author_name text not null check (length(btrim(author_name)) > 0),
  title text not null check (length(btrim(title)) > 0),
  cuisine text not null check (cuisine in (
    'American', 'Arabic', 'Chinese', 'German', 'Indian',
    'Iranian', 'Italian', 'Japanese', 'Mexican', 'Other'
  )),
  category text not null check (category in (
    'Breakfast', 'Main Dish', 'Fast Food', 'Soup',
    'Salad', 'Dessert', 'Snack', 'Drink'
  )),
  ingredients text[] not null check (cardinality(ingredients) > 0),
  steps text[] not null check (cardinality(steps) > 0),
  prep_time_minutes integer not null check (prep_time_minutes > 0),
  image_url text not null check (image_url ~* '^https?://'),
  created_at timestamptz not null default now()
);

create table if not exists public.ratings (
  id uuid primary key default gen_random_uuid(),
  recipe_id uuid not null references public.recipes(id) on delete cascade,
  rating smallint not null check (rating between 1 and 5),
  created_at timestamptz not null default now()
);

create index if not exists ratings_recipe_id_idx
  on public.ratings(recipe_id);

create or replace view public.recipe_rating_summaries
with (security_invoker = true)
as
select
  recipe_id,
  round(avg(rating)::numeric, 1)::double precision as average_rating,
  count(*)::integer as rating_count
from public.ratings
group by recipe_id;

alter table public.recipes enable row level security;
alter table public.ratings enable row level security;

drop policy if exists "Anyone can read recipes" on public.recipes;
create policy "Anyone can read recipes"
  on public.recipes for select to anon, authenticated
  using (true);

drop policy if exists "Anyone can add recipes" on public.recipes;
create policy "Anyone can add recipes"
  on public.recipes for insert to anon, authenticated
  with check (true);

drop policy if exists "Anyone can read ratings" on public.ratings;
create policy "Anyone can read ratings"
  on public.ratings for select to anon, authenticated
  using (true);

drop policy if exists "Anyone can add valid ratings" on public.ratings;
create policy "Anyone can add valid ratings"
  on public.ratings for insert to anon, authenticated
  with check (rating between 1 and 5);

grant select, insert on public.recipes to anon, authenticated;
grant select, insert on public.ratings to anon, authenticated;
grant select on public.recipe_rating_summaries to anon, authenticated;
grant usage on schema public to anon, authenticated;
