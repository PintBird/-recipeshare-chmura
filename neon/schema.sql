create table if not exists public.recipes (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid,
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
  ingredients jsonb not null
    check (jsonb_typeof(ingredients) = 'array' and jsonb_array_length(ingredients) > 0),
  steps jsonb not null
    check (jsonb_typeof(steps) = 'array' and jsonb_array_length(steps) > 0),
  prep_time_minutes integer not null check (prep_time_minutes > 0),
  image_url text not null check (image_url ~* '^https?://'),
  created_at timestamptz not null default now()
);

create table if not exists public.ratings (
  id uuid primary key default gen_random_uuid(),
  recipe_id uuid not null references public.recipes(id) on delete cascade,
  user_id uuid not null,
  rating smallint not null check (rating between 1 and 5),
  created_at timestamptz not null default now(),
  unique (recipe_id, user_id)
);

create index if not exists recipes_owner_id_idx on public.recipes(owner_id);
create index if not exists ratings_recipe_id_idx on public.ratings(recipe_id);

create or replace function public.prevent_author_rating()
returns trigger
language plpgsql
as $$
begin
  if exists (
    select 1
    from public.recipes
    where id = new.recipe_id
      and owner_id = new.user_id
  ) then
    raise exception 'Recipe authors cannot rate their own recipes.';
  end if;
  return new;
end;
$$;

drop trigger if exists ratings_prevent_author_rating on public.ratings;
create trigger ratings_prevent_author_rating
  before insert or update of recipe_id, user_id on public.ratings
  for each row execute function public.prevent_author_rating();

create or replace view public.recipe_rating_summaries as
select
  recipe_id,
  round(avg(rating)::numeric, 1)::double precision as average_rating,
  count(*)::integer as rating_count
from public.ratings
group by recipe_id;
