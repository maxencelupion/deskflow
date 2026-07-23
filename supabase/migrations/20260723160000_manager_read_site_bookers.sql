create policy "profiles_select_manager_site_bookers"
on profiles for select
to authenticated
using (
  my_role() = 'manager'
  and exists (
    select 1 from bookings b
    join resources r on r.id = b.resource_id
    where b.user_id = profiles.id
      and r.site_id = my_site_id()
  )
);
