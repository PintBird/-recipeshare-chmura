insert into public.recipes (
  id, author_name, title, cuisine, category, ingredients, steps,
  prep_time_minutes, image_url
) values
  (
    '00000000-0000-4000-8000-000000000001',
    'Niloofar',
    'Persian Saffron Chicken',
    'Iranian',
    'Main Dish',
    array['4 chicken thighs', '1 large onion, sliced', '1/2 teaspoon bloomed saffron', '2 tablespoons lemon juice', 'Salt and pepper'],
    array['Season the chicken with salt, pepper, saffron, and lemon juice.', 'Brown the onion in a pan, then add the chicken.', 'Cover and cook gently for 35 minutes, until cooked through.'],
    45,
    'https://images.unsplash.com/photo-1532550907401-a500c9a57435?auto=format&fit=crop&w=1200&q=85'
  ),
  (
    '00000000-0000-4000-8000-000000000002',
    'Marco',
    'Tuscan Tomato Soup',
    'Italian',
    'Soup',
    array['6 ripe tomatoes', '1 small onion, chopped', '2 cups vegetable stock', 'A handful of fresh basil', '2 tablespoons olive oil'],
    array['Soften the onion in olive oil over medium heat.', 'Add tomatoes and stock, then simmer for 20 minutes.', 'Blend until smooth and finish with fresh basil.'],
    30,
    'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=1200&q=85'
  ),
  (
    '00000000-0000-4000-8000-000000000003',
    'Mei',
    'Sesame Ginger Noodles',
    'Chinese',
    'Main Dish',
    array['250 g wheat noodles', '2 tablespoons sesame oil', '1 tablespoon grated ginger', '2 tablespoons soy sauce', '2 green onions, sliced'],
    array['Cook the noodles according to the package directions.', 'Warm sesame oil with ginger, then stir in soy sauce.', 'Toss the noodles in the sauce and top with green onions.'],
    20,
    'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=1200&q=85'
  ),
  (
    '00000000-0000-4000-8000-000000000004',
    'Asha',
    'Cardamom Banana Pancakes',
    'Indian',
    'Breakfast',
    array['1 ripe banana', '1 cup flour', '3/4 cup milk', '1/2 teaspoon ground cardamom', '1 teaspoon baking powder'],
    array['Mash the banana and whisk it with the milk.', 'Fold in the flour, cardamom, and baking powder.', 'Cook small pancakes in a lightly oiled pan until golden on both sides.'],
    25,
    'https://images.unsplash.com/photo-1528207776546-365bb710ee93?auto=format&fit=crop&w=1200&q=85'
  )
on conflict (id) do nothing;

insert into public.ratings (id, recipe_id, rating)
select
  md5('seed-rating-' || recipe_id::text || '-' || number::text)::uuid,
  recipe_id,
  case
    when recipe_id = '00000000-0000-4000-8000-000000000001' and number % 4 = 0 then 4
    when recipe_id = '00000000-0000-4000-8000-000000000002' and number > 6 then 4
    else 5
  end
from (
  select '00000000-0000-4000-8000-000000000001'::uuid as recipe_id, generate_series(1, 8) as number
  union all
  select '00000000-0000-4000-8000-000000000002'::uuid, generate_series(1, 10)
) as sample_ratings
on conflict (id) do nothing;
