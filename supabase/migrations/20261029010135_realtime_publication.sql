-- 실시간 구독 대상 (#81). 원천: docs/common/db-schema.md §10
alter publication supabase_realtime add table
  public.meals,
  public.meal_members,
  public.notices,
  public.host_handovers,
  public.host_handover_rejections;
