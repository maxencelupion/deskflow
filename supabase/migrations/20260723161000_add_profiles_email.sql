-- Adds an email column to profiles so managers/admins can identify members
alter table profiles add column email text;

update profiles p
set email = u.email
from auth.users u
where u.id = p.id
  and p.email is null;

-- Sets email to not null after populating it from auth.users
alter table profiles alter column email set not null;

-- Updating handle_new_user function to insert email on signup
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$ language plpgsql security definer set search_path = public;
