create extension if not exists btree_gist;

create type user_role as enum ('member', 'manager', 'admin');
create type resource_type as enum ('office', 'room');
create type booking_status as enum ('confirmed', 'cancelled_not_charged', 'cancelled_charged');

create table sites (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

create table site_weekly_hours (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null references sites(id) on delete cascade,
  day_of_week int not null check (day_of_week between 0 and 6), -- Sun to Sat, from extract() function
  is_closed boolean not null default false,
  opens_at time,
  closes_at time,
  unique (site_id, day_of_week), -- Enforces one entry per day
  check (
    (is_closed = true and opens_at is null and closes_at is null)
    or
    (is_closed = false and opens_at is not null and closes_at is not null and closes_at > opens_at)
  )
);

create table resources (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null references sites(id) on delete cascade,
  name text not null,
  type resource_type not null,
  capacity int not null check (capacity >= 1), -- Office is always 1 person, Room is at least 1 person
  created_at timestamptz not null default now()
);

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role user_role not null default 'member',
  site_id uuid references sites(id), -- Only used for manager role
  monthly_quota_hours numeric not null default 10,
  created_at timestamptz not null default now(),
  constraint manager_has_site check (role <> 'manager' or site_id is not null)
);

create table bookings (
  id uuid primary key default gen_random_uuid(),
  resource_id uuid not null references resources(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  seat_number int not null check (seat_number >= 1),
  start_at timestamptz not null,
  end_at timestamptz not null,
  hours_charged numeric not null,
  status booking_status not null default 'confirmed',
  created_at timestamptz not null default now(),
  cancelled_at timestamptz,
  check (end_at > start_at),
  exclude using gist (
    resource_id with =,
    seat_number with =,
    tstzrange(start_at, end_at) with &&
  ) where (status = 'confirmed') -- Used for exclusion constraint: looking for overlapping bookings using the same ressource, same seat on the same time range with a confirmed status
);
