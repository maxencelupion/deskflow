create or replace function my_role()
returns user_role as $$
  select role from profiles where id = auth.uid();
$$ language sql stable security definer
set search_path = public;

create or replace function my_site_id()
returns uuid as $$
  select site_id from profiles where id = auth.uid();
$$ language sql stable security definer
set search_path = public;

alter table profiles enable row level security;

-- any authenticated user can view their own profile
create policy "profiles_select_own"
on profiles for select
to authenticated
using (id = auth.uid());

-- admin can view all profiles
create policy "profiles_select_admin"
on profiles for select
to authenticated
using (my_role() = 'admin');

-- admin can update any profile, but cannot modify another admin's profile
create policy "profiles_update_admin"
on profiles for update
to authenticated
using (
  my_role() = 'admin'
  and (id = auth.uid() or role <> 'admin')
)
with check (
  my_role() = 'admin'
  and (id = auth.uid() or role <> 'admin')
);

alter table sites enable row level security;

-- any authenticated user can view the list of sites
create policy "sites_select_all"
on sites for select
to authenticated
using (true);

-- admin can modify all sites
create policy "sites_admin_all"
on sites for all
to authenticated
using (my_role() = 'admin')
with check (my_role() = 'admin');

alter table site_weekly_hours enable row level security;

-- any authenticated user can view the list of weekly hours
create policy "weekly_hours_select_all"
on site_weekly_hours for select
to authenticated
using (true);

-- admin can modify all weekly hours
create policy "weekly_hours_admin_all"
on site_weekly_hours for all
to authenticated
using (my_role() = 'admin')
with check (my_role() = 'admin');

alter table resources enable row level security;

-- any authenticated user can view the list of resources
create policy "resources_select_all"
on resources for select
to authenticated
using (true);

-- managers can manage resources for their site
create policy "resources_manager_write"
on resources for all
to authenticated
using (my_role() = 'manager' and site_id = my_site_id())
with check (my_role() = 'manager' and site_id = my_site_id());

-- admin can manage all resources
create policy "resources_admin_all"
on resources for all
to authenticated
using (my_role() = 'admin')
with check (my_role() = 'admin');

alter table bookings enable row level security;

-- authenticated users can view their own bookings
create policy "bookings_select_own"
on bookings for select
to authenticated
using (user_id = auth.uid());

-- authenticated users can create their own bookings
create policy "bookings_insert_own"
on bookings for insert
to authenticated
with check (user_id = auth.uid());

-- authenticated users can update (cancel) their own bookings
create policy "bookings_update_own"
on bookings for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

-- managers can view bookings for their site
create policy "bookings_select_manager"
on bookings for select
to authenticated
using (
  my_role() = 'manager'
  and exists (
    select 1 from resources resource -- check that the resource belongs to the manager site
    where resource.id = bookings.resource_id
      and resource.site_id = my_site_id()
  )
);

-- admin can view all bookings
create policy "bookings_admin_select"
on bookings for select
to authenticated
using (my_role() = 'admin');

-- admin can update all bookings
create policy "bookings_admin_update"
on bookings for update
to authenticated
using (my_role() = 'admin')
with check (my_role() = 'admin');
