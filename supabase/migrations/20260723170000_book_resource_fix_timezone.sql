create or replace function book_resource(
  p_resource_id uuid,
  p_start_at timestamptz,
  p_hours numeric
)
returns bookings
language plpgsql
security definer
set search_path = public
-- Timezone fix: pin to Europe/Paris to avoid session timezone issues
set timezone = 'Europe/Paris'
as $$
declare
  v_user_id uuid := auth.uid();
  v_capacity int;
  v_end_at timestamptz;
  v_quota numeric;
  v_used numeric;
  v_period_start timestamptz := date_trunc('month', now());
  v_period_end timestamptz := date_trunc('month', now()) + interval '1 month';
  v_seat int;
  v_booking bookings;
  v_site_hours site_weekly_hours;
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  if p_hours <= 0 then
    raise exception 'Duration must be greater than zero';
  end if;

  if p_hours != floor(p_hours) then
    raise exception 'Duration must be a whole number of hours';
  end if;

  v_end_at := p_start_at + (p_hours * interval '1 hour');

  -- Look up the resource's site hours for the day the booking starts on
  select swh.* into v_site_hours
  from site_weekly_hours swh
  join resources r on r.site_id = swh.site_id
  where r.id = p_resource_id
    and swh.day_of_week = extract(dow from p_start_at);

  if v_site_hours is null or v_site_hours.is_closed then
    raise exception 'Site is closed on the selected day';
  end if;

  if p_start_at::date <> v_end_at::date
     or p_start_at::time < v_site_hours.opens_at
     or v_end_at::time > v_site_hours.closes_at then
    raise exception 'Booking must fall within site opening hours';
  end if;

  -- A member can't be in two places at once, even across different resources
  if exists (
    select 1 from bookings b
    where b.user_id = v_user_id
      and b.status = 'confirmed'
      and b.start_at < v_end_at
      and b.end_at > p_start_at
  ) then
    raise exception 'You already have a booking during this time';
  end if;

  select capacity into v_capacity from resources where id = p_resource_id;

  select monthly_quota_hours into v_quota from profiles where id = v_user_id;

  select coalesce(sum(hours_charged), 0) into v_used
  from bookings
  where user_id = v_user_id
    and status = 'confirmed'
    and start_at >= v_period_start
    and start_at < v_period_end;

  if v_used + p_hours > v_quota then
    raise exception 'Booking would exceed your monthly quota';
  end if;

  select seat into v_seat
  -- Checking for the first available seat that does not overlap with any confirmed bookings
  from generate_series(1, v_capacity) as seat
  where not exists (
    select 1 from bookings b
    where b.resource_id = p_resource_id
      and b.status = 'confirmed'
      and b.seat_number = seat
      and b.start_at < v_end_at
      and b.end_at > p_start_at
  )
  order by seat
  limit 1;

  if v_seat is null then
    raise exception 'No seats available for the selected time';
  end if;

  insert into bookings (resource_id, user_id, seat_number, start_at, end_at, hours_charged, status)
  values (p_resource_id, v_user_id, v_seat, p_start_at, v_end_at, p_hours, 'confirmed')
  returning * into v_booking;

  return v_booking;
end;
$$;

grant execute on function book_resource(uuid, timestamptz, numeric) to authenticated;
