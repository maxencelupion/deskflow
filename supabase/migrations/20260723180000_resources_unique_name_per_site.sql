-- Prevents a site from having two resources with the same name
alter table resources
  add constraint resources_site_id_name_key unique (site_id, name);
