-- 식당/가게명·집합/수령 장소 필수 입력 (#67). 원천: docs/common/db-schema.md §4 meals

-- 제약을 걸기 전에 기존 빈 값을 채운다
update public.meals set restaurant_name = '미정'
where restaurant_name is null or btrim(restaurant_name) = '';

update public.meals set place = '미정'
where place is null or btrim(place) = '';

alter table public.meals
  alter column restaurant_name set not null,
  alter column place set not null,
  add constraint meals_restaurant_name_check check (btrim(restaurant_name) <> ''),
  add constraint meals_place_check check (btrim(place) <> '');
