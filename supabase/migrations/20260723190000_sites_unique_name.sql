-- Prevents two sites from having the same name
alter table sites
  add constraint sites_name_key unique (name);
