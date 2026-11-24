-- Recipe and rating records are stored in Neon. This script only configures
-- Supabase Storage for recipe image uploads.
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
