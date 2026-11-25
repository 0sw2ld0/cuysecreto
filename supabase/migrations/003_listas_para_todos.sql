-- CuySecreto · migración 003: opción "todos ven las listas de todos".
-- Ya incluida en schema.sql; esto es solo para proyectos con el esquema anterior.


alter table public.cs_events add column if not exists lists_public boolean not null default false;

create or replace function public.cs__event_json(e public.cs_events) returns json
language sql stable as $$
  select json_build_object(
    'code', e.code, 'name', e.name, 'budget', e.budget, 'currency', e.currency,
    'exchange_date', e.exchange_date, 'note', e.note, 'drawn', e.drawn_at is not null,
    'drawn_at', e.drawn_at, 'draw_mode', e.draw_mode, 'lists_public', e.lists_public)
$$;


create or replace function public.cs_admin_set_lists_public(p_code text, p_token text, p_on boolean)
returns json
language plpgsql security definer set search_path = public, extensions as $$
declare e cs_events;
begin
  e := cs__admin_event(p_code, p_token);
  update cs_events set lists_public = coalesce(p_on, false) where id = e.id;
  return cs_admin_get(p_code, p_token);
end $$;

create or replace function public.cs_group_wishes(p_token text) returns json
language plpgsql volatile security definer set search_path = public, extensions as $$
declare p cs_participants; e cs_events;
begin
  p := cs__session(p_token);
  select * into e from cs_events where id = p.event_id;
  if e.draw_mode <> 'manual' and not e.lists_public then
    raise exception 'En este grupo solo ves la lista de quien te tocó.' using errcode = 'P0001';
  end if;
  return (
    select coalesce(json_agg(json_build_object('id', o.id, 'name', o.name, 'wishes', cs__wishes_json(o.id))
           order by lower(o.name)), '[]'::json)
      from cs_participants o where o.event_id = e.id and o.id <> p.id);
end $$;

revoke execute on function public.cs_admin_set_lists_public(text, text, boolean) from public, anon, authenticated;
grant execute on function public.cs_admin_set_lists_public(text, text, boolean) to anon, authenticated;
