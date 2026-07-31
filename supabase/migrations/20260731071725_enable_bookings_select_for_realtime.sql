create policy "bookings_select_all"
on bookings for select
to authenticated
using (true);
