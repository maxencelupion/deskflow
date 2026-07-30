  create or replace function public.get_home_stats()
  returns table (sites_count bigint, rooms_count bigint)
  language sql
  security definer
  set search_path = public
  as $$
    select
      (select count(*) from public.sites) as sites_count,
      (select count(*) from public.resources where type = 'room') as rooms_count;
  $$;

  revoke all on function public.get_home_stats() from public;
  grant execute on function public.get_home_stats() to anon, authenticated;
