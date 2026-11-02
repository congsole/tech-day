-- 초기 스키마. 원천: docs/common/db-schema.md (절 번호는 그 문서를 가리킨다)

-- §7 예약 작업용 확장
create extension if not exists pg_cron with schema pg_catalog;

-- ============================================================
-- §3 열거형
-- ============================================================
create type public.meal_type as enum ('dine', 'delivery');
create type public.meal_status as enum ('recruiting', 'ordering', 'ordered', 'settling', 'canceled');
create type public.handover_status as enum ('pending', 'accepted', 'failed');

-- ============================================================
-- §4 테이블
-- ============================================================
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text check (display_name is null or btrim(display_name) <> ''),
  created_at timestamptz not null default now()
);

create table public.meals (
  id uuid primary key default gen_random_uuid(),
  host_id uuid not null default auth.uid() references public.profiles (id),
  title text not null check (btrim(title) <> ''),
  type public.meal_type not null,
  restaurant_name text,
  menu_url text,
  place text,
  order_time timestamptz not null,
  capacity integer not null check (capacity >= 1),
  memo text,
  status public.meal_status not null default 'recruiting',
  cancel_reason text check (cancel_reason is null or btrim(cancel_reason) <> ''),
  created_at timestamptz not null default now()
);
create index meals_status_created_at_idx on public.meals (status, created_at desc);
create index meals_status_order_time_idx on public.meals (status, order_time);

create table public.meal_members (
  meal_id uuid not null references public.meals (id) on delete cascade,
  user_id uuid not null default auth.uid() references public.profiles (id),
  confirmed_at timestamptz,
  joined_at timestamptz not null default now(),
  primary key (meal_id, user_id)
);
create index meal_members_user_id_idx on public.meal_members (user_id);

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  meal_id uuid not null,
  user_id uuid not null default auth.uid(),
  name text not null check (btrim(name) <> ''),
  price integer not null check (price >= 0),
  created_at timestamptz not null default now(),
  foreign key (meal_id, user_id) references public.meal_members (meal_id, user_id) on delete cascade
);
create index order_items_meal_id_user_id_idx on public.order_items (meal_id, user_id);

create table public.notices (
  id uuid primary key default gen_random_uuid(),
  meal_id uuid not null references public.meals (id) on delete cascade,
  author_id uuid not null default auth.uid() references public.profiles (id),
  content text not null check (btrim(content) <> ''),
  created_at timestamptz not null default now()
);
create index notices_meal_id_created_at_idx on public.notices (meal_id, created_at desc);

create table public.host_handovers (
  id uuid primary key default gen_random_uuid(),
  meal_id uuid not null references public.meals (id) on delete cascade,
  from_host_id uuid not null references public.profiles (id),
  reason text not null check (btrim(reason) <> ''),
  status public.handover_status not null default 'pending',
  accepted_by uuid references public.profiles (id),
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);
create unique index host_handovers_one_pending_idx on public.host_handovers (meal_id) where status = 'pending';

create table public.host_handover_rejections (
  handover_id uuid not null references public.host_handovers (id) on delete cascade,
  user_id uuid not null references public.profiles (id),
  created_at timestamptz not null default now(),
  primary key (handover_id, user_id)
);

-- ============================================================
-- §5 보조 함수 (RLS·트리거·RPC 공용)
-- ============================================================
create function public.is_meal_member(p_meal_id uuid)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.meal_members
    where meal_id = p_meal_id and user_id = auth.uid()
  );
$$;

-- 열려 있음: 모집중이고 주문 예정 시간 전
create function public.is_meal_open(p_meal_id uuid)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.meals
    where id = p_meal_id and status = 'recruiting' and order_time > now()
  );
$$;

-- ============================================================
-- §7 트리거
-- ============================================================
create function public.handle_new_user()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.profiles (id) values (new.id);
  return new;
end;
$$;

create trigger handle_new_user
  after insert on auth.users
  for each row execute function public.handle_new_user();

create function public.add_host_as_member()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.meal_members (meal_id, user_id) values (new.id, new.host_id);
  return new;
end;
$$;

create trigger add_host_as_member
  after insert on public.meals
  for each row execute function public.add_host_as_member();

-- 겸상 행을 잠가 동시 참여가 정원을 넘지 않게 한다
create function public.check_meal_capacity()
returns trigger
language plpgsql security definer set search_path = ''
as $$
declare
  v_capacity integer;
begin
  select capacity into v_capacity from public.meals where id = new.meal_id for update;
  if not found then
    raise exception 'meal_not_found';
  end if;
  if not public.is_meal_open(new.meal_id) then
    raise exception 'meal_not_recruiting';
  end if;
  if (select count(*) from public.meal_members where meal_id = new.meal_id) >= v_capacity then
    raise exception 'meal_full';
  end if;
  return new;
end;
$$;

create trigger check_meal_capacity
  before insert on public.meal_members
  for each row execute function public.check_meal_capacity();

-- ============================================================
-- §5 권한: 컬럼 단위 grant
-- ============================================================
revoke all on
  public.profiles, public.meals, public.meal_members, public.order_items,
  public.notices, public.host_handovers, public.host_handover_rejections
from anon, authenticated;

grant select on
  public.profiles, public.meals, public.meal_members, public.order_items,
  public.notices, public.host_handovers, public.host_handover_rejections
to authenticated;

grant update (display_name) on public.profiles to authenticated;
grant insert (title, type, restaurant_name, menu_url, place, order_time, capacity, memo) on public.meals to authenticated;
grant update (place) on public.meals to authenticated;
grant insert (meal_id) on public.meal_members to authenticated;
grant delete on public.meal_members to authenticated;
grant insert (meal_id, name, price) on public.order_items to authenticated;
grant update (name, price) on public.order_items to authenticated;
grant delete on public.order_items to authenticated;
grant insert (meal_id, content) on public.notices to authenticated;

-- ============================================================
-- §5 권한: RLS
-- ============================================================
alter table public.profiles enable row level security;
alter table public.meals enable row level security;
alter table public.meal_members enable row level security;
alter table public.order_items enable row level security;
alter table public.notices enable row level security;
alter table public.host_handovers enable row level security;
alter table public.host_handover_rejections enable row level security;

-- profiles
create policy profiles_select on public.profiles
  for select to authenticated using (true);
create policy profiles_update on public.profiles
  for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

-- meals
create policy meals_select on public.meals
  for select to authenticated using (true);
create policy meals_insert on public.meals
  for insert to authenticated with check (host_id = auth.uid());
create policy meals_update on public.meals
  for update to authenticated
  using (host_id = auth.uid() and status = 'recruiting')
  with check (host_id = auth.uid() and status = 'recruiting');

-- meal_members
create policy meal_members_select on public.meal_members
  for select to authenticated using (true);
create policy meal_members_insert on public.meal_members
  for insert to authenticated with check (user_id = auth.uid());
create policy meal_members_delete on public.meal_members
  for delete to authenticated
  using (
    user_id = auth.uid()
    and confirmed_at is null
    and public.is_meal_open(meal_id)
    and not exists (
      select 1 from public.meals m
      where m.id = meal_members.meal_id and m.host_id = auth.uid()
    )
  );

-- order_items: 본인 행, 본인 미확정, 겸상이 열려 있을 때
create policy order_items_select on public.order_items
  for select to authenticated using (public.is_meal_member(meal_id));
create policy order_items_insert on public.order_items
  for insert to authenticated
  with check (
    user_id = auth.uid()
    and public.is_meal_open(meal_id)
    and exists (
      select 1 from public.meal_members mm
      where mm.meal_id = order_items.meal_id and mm.user_id = auth.uid() and mm.confirmed_at is null
    )
  );
create policy order_items_update on public.order_items
  for update to authenticated
  using (
    user_id = auth.uid()
    and public.is_meal_open(meal_id)
    and exists (
      select 1 from public.meal_members mm
      where mm.meal_id = order_items.meal_id and mm.user_id = auth.uid() and mm.confirmed_at is null
    )
  )
  with check (
    user_id = auth.uid()
    and public.is_meal_open(meal_id)
    and exists (
      select 1 from public.meal_members mm
      where mm.meal_id = order_items.meal_id and mm.user_id = auth.uid() and mm.confirmed_at is null
    )
  );
create policy order_items_delete on public.order_items
  for delete to authenticated
  using (
    user_id = auth.uid()
    and public.is_meal_open(meal_id)
    and exists (
      select 1 from public.meal_members mm
      where mm.meal_id = order_items.meal_id and mm.user_id = auth.uid() and mm.confirmed_at is null
    )
  );

-- notices
create policy notices_select on public.notices
  for select to authenticated using (public.is_meal_member(meal_id));
create policy notices_insert on public.notices
  for insert to authenticated
  with check (
    author_id = auth.uid()
    and exists (
      select 1 from public.meals m
      where m.id = notices.meal_id and m.host_id = auth.uid()
    )
  );

-- host_handovers, host_handover_rejections: 조회만 (변경은 RPC)
create policy host_handovers_select on public.host_handovers
  for select to authenticated using (public.is_meal_member(meal_id));
create policy host_handover_rejections_select on public.host_handover_rejections
  for select to authenticated
  using (
    exists (
      select 1 from public.host_handovers h
      where h.id = host_handover_rejections.handover_id and public.is_meal_member(h.meal_id)
    )
  );

-- ============================================================
-- §6 내부 함수 (클라이언트 실행 권한 없음)
-- ============================================================
create function public.resolve_host_handover(p_handover_id uuid)
returns void
language plpgsql security definer set search_path = ''
as $$
declare
  v_meal_id uuid;
  v_from_host_id uuid;
  v_order_time timestamptz;
begin
  select h.meal_id, h.from_host_id into v_meal_id, v_from_host_id
  from public.host_handovers h
  where h.id = p_handover_id and h.status = 'pending';
  if not found then
    return;
  end if;

  select m.order_time into v_order_time from public.meals m where m.id = v_meal_id for update;

  -- 주문 예정 시간이 지났거나, 기존 Host를 뺀 참여자 중 거절하지 않은 사람이 없으면 실패
  if v_order_time <= now() or not exists (
    select 1 from public.meal_members mm
    where mm.meal_id = v_meal_id
      and mm.user_id <> v_from_host_id
      and not exists (
        select 1 from public.host_handover_rejections r
        where r.handover_id = p_handover_id and r.user_id = mm.user_id
      )
  ) then
    update public.host_handovers set status = 'failed', resolved_at = now() where id = p_handover_id;
    update public.meals set status = 'canceled' where id = v_meal_id;
  end if;
end;
$$;

create function public.expire_host_handovers()
returns void
language plpgsql security definer set search_path = ''
as $$
declare
  v_id uuid;
begin
  for v_id in select id from public.host_handovers where status = 'pending' loop
    perform public.resolve_host_handover(v_id);
  end loop;
end;
$$;

create function public.start_due_orders()
returns void
language plpgsql security definer set search_path = ''
as $$
declare
  v_meal record;
begin
  for v_meal in
    select id, host_id from public.meals
    where status = 'recruiting' and order_time <= now()
    for update
  loop
    -- 메뉴 항목이 없는 참여자 제외 (Host는 남김)
    delete from public.meal_members mm
    where mm.meal_id = v_meal.id
      and mm.user_id <> v_meal.host_id
      and not exists (
        select 1 from public.order_items oi
        where oi.meal_id = mm.meal_id and oi.user_id = mm.user_id
      );

    if exists (select 1 from public.order_items where meal_id = v_meal.id) then
      update public.meals set status = 'ordering' where id = v_meal.id;
    else
      update public.meals set status = 'canceled' where id = v_meal.id;
    end if;
  end loop;
end;
$$;

-- ============================================================
-- §6 RPC 함수
-- ============================================================
create function public.confirm_order(p_meal_id uuid)
returns void
language plpgsql security definer set search_path = ''
as $$
declare
  v_confirmed_at timestamptz;
begin
  perform 1 from public.meals where id = p_meal_id for update;
  if not found then
    raise exception 'meal_not_found';
  end if;

  select confirmed_at into v_confirmed_at
  from public.meal_members
  where meal_id = p_meal_id and user_id = auth.uid();
  if not found then
    raise exception 'not_member';
  end if;
  if not public.is_meal_open(p_meal_id) then
    raise exception 'meal_not_recruiting';
  end if;
  if v_confirmed_at is not null then
    raise exception 'already_confirmed';
  end if;
  if not exists (
    select 1 from public.order_items where meal_id = p_meal_id and user_id = auth.uid()
  ) then
    raise exception 'no_items';
  end if;

  update public.meal_members set confirmed_at = now()
  where meal_id = p_meal_id and user_id = auth.uid();
end;
$$;

create function public.get_meal_member_emails(p_meal_id uuid)
returns table (user_id uuid, email text)
language plpgsql stable security definer set search_path = ''
as $$
declare
  v_host_id uuid;
begin
  select m.host_id into v_host_id from public.meals m where m.id = p_meal_id;
  if not found then
    raise exception 'meal_not_found';
  end if;
  if v_host_id <> auth.uid() then
    raise exception 'not_host';
  end if;

  return query
    select mm.user_id, u.email::text
    from public.meal_members mm
    join auth.users u on u.id = mm.user_id
    where mm.meal_id = p_meal_id;
end;
$$;

create function public.mark_meal_ordered(p_meal_id uuid)
returns void
language plpgsql security definer set search_path = ''
as $$
declare
  v_meal record;
begin
  select host_id, status into v_meal from public.meals where id = p_meal_id for update;
  if not found then
    raise exception 'meal_not_found';
  end if;
  if v_meal.host_id <> auth.uid() then
    raise exception 'not_host';
  end if;
  if v_meal.status <> 'ordering' then
    raise exception 'invalid_status';
  end if;

  update public.meals set status = 'ordered' where id = p_meal_id;
end;
$$;

create function public.start_settlement(p_meal_id uuid)
returns void
language plpgsql security definer set search_path = ''
as $$
declare
  v_meal record;
begin
  select host_id, status into v_meal from public.meals where id = p_meal_id for update;
  if not found then
    raise exception 'meal_not_found';
  end if;
  if v_meal.host_id <> auth.uid() then
    raise exception 'not_host';
  end if;
  if v_meal.status <> 'ordered' then
    raise exception 'invalid_status';
  end if;

  update public.meals set status = 'settling' where id = p_meal_id;
end;
$$;

create function public.request_host_handover(p_meal_id uuid, p_reason text)
returns void
language plpgsql security definer set search_path = ''
as $$
declare
  v_host_id uuid;
begin
  select host_id into v_host_id from public.meals where id = p_meal_id for update;
  if not found then
    raise exception 'meal_not_found';
  end if;
  if v_host_id <> auth.uid() then
    raise exception 'not_host';
  end if;
  if not public.is_meal_open(p_meal_id) then
    raise exception 'meal_not_recruiting';
  end if;
  if exists (
    select 1 from public.host_handovers where meal_id = p_meal_id and status = 'pending'
  ) then
    raise exception 'handover_pending';
  end if;
  if not exists (
    select 1 from public.meal_members where meal_id = p_meal_id and user_id <> v_host_id
  ) then
    raise exception 'no_other_members';
  end if;

  insert into public.host_handovers (meal_id, from_host_id, reason)
  values (p_meal_id, v_host_id, p_reason);
end;
$$;

create function public.accept_host_handover(p_handover_id uuid)
returns void
language plpgsql security definer set search_path = ''
as $$
declare
  v_handover record;
  v_order_time timestamptz;
begin
  select meal_id into v_handover from public.host_handovers where id = p_handover_id;
  if not found then
    raise exception 'handover_not_pending';
  end if;

  -- cancel_meal과 같은 순서(겸상 → 요청)로 잠근다
  select order_time into v_order_time from public.meals where id = v_handover.meal_id for update;
  select meal_id, from_host_id, status into v_handover
  from public.host_handovers where id = p_handover_id for update;

  if v_handover.status <> 'pending' then
    raise exception 'handover_not_pending';
  end if;
  if auth.uid() = v_handover.from_host_id or not exists (
    select 1 from public.meal_members where meal_id = v_handover.meal_id and user_id = auth.uid()
  ) then
    raise exception 'not_member';
  end if;
  if v_order_time <= now() then
    raise exception 'handover_expired';
  end if;

  update public.meals set host_id = auth.uid() where id = v_handover.meal_id;
  -- 기존 Host의 메뉴 항목은 cascade로 함께 삭제
  delete from public.meal_members
  where meal_id = v_handover.meal_id and user_id = v_handover.from_host_id;
  update public.host_handovers
  set status = 'accepted', accepted_by = auth.uid(), resolved_at = now()
  where id = p_handover_id;
end;
$$;

create function public.reject_host_handover(p_handover_id uuid)
returns void
language plpgsql security definer set search_path = ''
as $$
declare
  v_handover record;
begin
  select meal_id into v_handover from public.host_handovers where id = p_handover_id;
  if not found then
    raise exception 'handover_not_pending';
  end if;

  perform 1 from public.meals where id = v_handover.meal_id for update;
  select meal_id, from_host_id, status into v_handover
  from public.host_handovers where id = p_handover_id for update;

  if v_handover.status <> 'pending' then
    raise exception 'handover_not_pending';
  end if;
  if auth.uid() = v_handover.from_host_id or not exists (
    select 1 from public.meal_members where meal_id = v_handover.meal_id and user_id = auth.uid()
  ) then
    raise exception 'not_member';
  end if;

  insert into public.host_handover_rejections (handover_id, user_id)
  values (p_handover_id, auth.uid())
  on conflict do nothing;

  perform public.resolve_host_handover(p_handover_id);
end;
$$;

create function public.cancel_meal(p_meal_id uuid, p_reason text)
returns void
language plpgsql security definer set search_path = ''
as $$
declare
  v_host_id uuid;
begin
  select host_id into v_host_id from public.meals where id = p_meal_id for update;
  if not found then
    raise exception 'meal_not_found';
  end if;
  if v_host_id <> auth.uid() then
    raise exception 'not_host';
  end if;
  if not public.is_meal_open(p_meal_id) then
    raise exception 'meal_not_recruiting';
  end if;

  update public.meals set status = 'canceled', cancel_reason = p_reason where id = p_meal_id;
  update public.host_handovers set status = 'failed', resolved_at = now()
  where meal_id = p_meal_id and status = 'pending';
end;
$$;

create function public.update_order_time(p_meal_id uuid, p_order_time timestamptz)
returns void
language plpgsql security definer set search_path = ''
as $$
declare
  v_host_id uuid;
begin
  select host_id into v_host_id from public.meals where id = p_meal_id for update;
  if not found then
    raise exception 'meal_not_found';
  end if;
  if v_host_id <> auth.uid() then
    raise exception 'not_host';
  end if;
  if not public.is_meal_open(p_meal_id) then
    raise exception 'meal_not_recruiting';
  end if;
  if exists (
    select 1 from public.host_handovers where meal_id = p_meal_id and status = 'pending'
  ) then
    raise exception 'handover_pending';
  end if;
  if p_order_time is null or p_order_time <= now() then
    raise exception 'invalid_order_time';
  end if;

  update public.meals set order_time = p_order_time where id = p_meal_id;
end;
$$;

-- ============================================================
-- 함수 실행 권한: RPC와 RLS 보조 함수만 authenticated에 연다
-- ============================================================
revoke execute on all functions in schema public from public, anon, authenticated;

grant execute on function
  public.is_meal_member(uuid),
  public.is_meal_open(uuid),
  public.confirm_order(uuid),
  public.get_meal_member_emails(uuid),
  public.mark_meal_ordered(uuid),
  public.start_settlement(uuid),
  public.request_host_handover(uuid, text),
  public.accept_host_handover(uuid),
  public.reject_host_handover(uuid),
  public.cancel_meal(uuid, text),
  public.update_order_time(uuid, timestamptz)
to authenticated;

-- ============================================================
-- §7 예약 작업: 1분마다 넘기기 정리 → 주문중 전환
-- ============================================================
select cron.schedule(
  'close-due-meals',
  '* * * * *',
  $$select public.expire_host_handovers(); select public.start_due_orders();$$
);
