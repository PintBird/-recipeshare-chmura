create table if not exists public.recipes (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references auth.users(id) on delete set null,
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

alter table public.recipes
  add column if not exists owner_id uuid references auth.users(id) on delete set null;

create table if not exists public.ratings (
  id uuid primary key default gen_random_uuid(),
  recipe_id uuid not null references public.recipes(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  rating smallint not null check (rating between 1 and 5),
  created_at timestamptz not null default now()
);

alter table public.ratings
  add column if not exists user_id uuid references auth.users(id) on delete cascade;

create index if not exists recipes_owner_id_idx on public.recipes(owner_id);
create index if not exists ratings_recipe_id_idx on public.ratings(recipe_id);
create unique index if not exists ratings_user_recipe_idx
  on public.ratings(recipe_id, user_id);

create or replace function public.prevent_author_rating()
returns trigger
language plpgsql
security definer
set search_path = ''
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

create or replace view public.recipe_rating_summaries
with (security_invoker = true)
as
select
  recipe_id,
  round(avg(rating)::numeric, 1)::double precision as average_rating,
  count(*)::integer as rating_count
from public.ratings
where user_id is not null
group by recipe_id;

alter table public.recipes enable row level security;
alter table public.ratings enable row level security;

drop policy if exists "Anyone can read recipes" on public.recipes;
drop policy if exists "Anyone can add recipes" on public.recipes;
drop policy if exists "Users can create recipes" on public.recipes;
drop policy if exists "Owners can update recipes" on public.recipes;
drop policy if exists "Owners can delete recipes" on public.recipes;
create policy "Anyone can read recipes"
  on public.recipes for select to anon, authenticated
  using (true);
create policy "Users can create recipes"
  on public.recipes for insert to authenticated
  with check (owner_id = (select auth.uid()));
create policy "Owners can update recipes"
  on public.recipes for update to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));
create policy "Owners can delete recipes"
  on public.recipes for delete to authenticated
  using (owner_id = (select auth.uid()));

drop policy if exists "Anyone can read ratings" on public.ratings;
drop policy if exists "Anyone can add valid ratings" on public.ratings;
drop policy if exists "Signed-in users can read ratings" on public.ratings;
drop policy if exists "Users can add own ratings" on public.ratings;
drop policy if exists "Users can change own ratings" on public.ratings;
create policy "Anyone can read ratings"
  on public.ratings for select to anon, authenticated
  using (true);
create policy "Users can add own ratings"
  on public.ratings for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and not exists (
      select 1 from public.recipes
      where recipes.id = ratings.recipe_id
        and recipes.owner_id = (select auth.uid())
    )
  );
create policy "Users can change own ratings"
  on public.ratings for update to authenticated
  using (user_id = (select auth.uid()))
  with check (
    user_id = (select auth.uid())
    and not exists (
      select 1 from public.recipes
      where recipes.id = ratings.recipe_id
        and recipes.owner_id = (select auth.uid())
    )
  );

grant select on public.recipes to anon, authenticated;
grant insert, update, delete on public.recipes to authenticated;
grant select on public.ratings to anon, authenticated;
grant insert, update on public.ratings to authenticated;
grant select on public.recipe_rating_summaries to anon, authenticated;
revoke insert, update, delete on public.recipes from anon;
revoke insert, update on public.ratings from anon;
grant usage on schema public to anon, authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'recipe-images',
  'recipe-images',
  true,
  4194304,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Recipe images are publicly readable" on storage.objects;
drop policy if exists "Signed-in users can upload recipe images" on storage.objects;
drop policy if exists "Owners can update recipe images" on storage.objects;
drop policy if exists "Owners can delete recipe images" on storage.objects;
create policy "Recipe images are publicly readable"
  on storage.objects for select
  using (bucket_id = 'recipe-images');
create policy "Signed-in users can upload recipe images"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'recipe-images'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
create policy "Owners can update recipe images"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'recipe-images'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  )
  with check (
    bucket_id = 'recipe-images'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
create policy "Owners can delete recipe images"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'recipe-images'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
