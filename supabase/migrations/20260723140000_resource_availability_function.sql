create or replace function get_resource_bookings_for_range(
  p_resource_id uuid,
  p_range_start timestamptz,
  p_range_end timestamptz
)
returns table (start_at timestamptz, end_at timestamptz, seat_number int)
language sql
stable
security definer
set search_path = public
as $$
  select b.start_at, b.end_at, b.seat_number
  from bookings b
  where b.resource_id = p_resource_id
    and b.status = 'confirmed'
    and b.start_at < p_range_end
    and b.end_at > p_range_start
  order by b.start_at;
$$;

grant execute on function get_resource_bookings_for_range(uuid, timestamptz, timestamptz) to authenticated;
