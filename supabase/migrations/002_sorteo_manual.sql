-- CuySecreto · migración 002: modo de sorteo hecho a mano.
-- Ya incluida en schema.sql; esto es solo para proyectos que ya tenían el esquema anterior.


alter table public.cs_events add column if not exists draw_mode text not null default 'app';
do $$ begin
  alter table public.cs_events add constraint cs_events_draw_mode_check check (draw_mode in ('app','manual'));
exception when duplicate_object then null; end $$;

create or replace function public.cs__event_json(e public.cs_events) returns json
language sql stable as $$
  select json_build_object(
    'code', e.code, 'name', e.name, 'budget', e.budget, 'currency', e.currency,
    'exchange_date', e.exchange_date, 'note', e.note, 'drawn', e.drawn_at is not null,
    'drawn_at', e.drawn_at, 'draw_mode', e.draw_mode)
$$;


create or replace function public.cs_admin_set_draw_mode(p_code text, p_token text, p_mode text)
returns json
language plpgsql security definer set search_path = public, extensions as $$
declare e cs_events;
begin
  e := cs__admin_event(p_code, p_token);
  if p_mode not in ('app', 'manual') then
    raise exception 'Modo de sorteo no válido' using errcode = 'P0001';
  end if;
  if e.drawn_at is not null and p_mode <> e.draw_mode then
    raise exception 'La app ya hizo el sorteo. Deshazlo antes de cambiar a sorteo a mano.' using errcode = 'P0001';
  end if;
  update cs_events set draw_mode = p_mode where id = e.id;
  return cs_admin_get(p_code, p_token);
end $$;

create or replace function public.cs_admin_draw(p_code text, p_token text) returns json
language plpgsql security definer set search_path = public, extensions as $$
declare
  e cs_events; ids uuid[]; n int; attempt int; ok boolean; i int; giver uuid; recv uuid;
begin
  e := cs__admin_event(p_code, p_token);
  if e.draw_mode = 'manual' then
    raise exception 'Este grupo sorteó a mano; la app no sortea.' using errcode = 'P0001';
  end if;
  if e.drawn_at is not null then
    raise exception 'El sorteo ya está hecho' using errcode = 'P0001';
  end if;
  select count(*) into n from cs_participants where event_id = e.id;
  if n < 3 then
    raise exception 'Se necesitan al menos 3 personas para sortear' using errcode = 'P0001';
  end if;

  for attempt in 1..2000 loop
    select array_agg(id order by random()) into ids from cs_participants where event_id = e.id;
    ok := true;
    for i in 1..n loop
      giver := ids[i];
      recv := ids[(i % n) + 1];
      if exists (select 1 from cs_exclusions
                  where event_id = e.id and a_id = least(giver, recv) and b_id = greatest(giver, recv)) then
        ok := false; exit;
      end if;
    end loop;
    exit when ok;
  end loop;

  if not ok then
    raise exception 'Con esas exclusiones no se puede sortear. Quita alguna pareja excluida.' using errcode = 'P0001';
  end if;

  for i in 1..n loop
    update cs_participants set receiver_id = ids[(i % n) + 1], revealed_at = null where id = ids[i];
  end loop;
  update cs_events set drawn_at = now() where id = e.id;
  return cs_admin_get(p_code, p_token);
end $$;

create or replace function public.cs_group_wishes(p_token text) returns json
language plpgsql volatile security definer set search_path = public, extensions as $$
declare p cs_participants; e cs_events;
begin
  p := cs__session(p_token);
  select * into e from cs_events where id = p.event_id;
  if e.draw_mode <> 'manual' then
    raise exception 'En este grupo el sorteo es secreto: solo ves la lista de quien te tocó.' using errcode = 'P0001';
  end if;
  return (
    select coalesce(json_agg(json_build_object('id', o.id, 'name', o.name, 'wishes', cs__wishes_json(o.id))
           order by lower(o.name)), '[]'::json)
      from cs_participants o where o.event_id = e.id and o.id <> p.id);
end $$;

revoke execute on function public.cs_admin_set_draw_mode(text, text, text), public.cs_group_wishes(text) from public, anon, authenticated;
grant execute on function public.cs_admin_set_draw_mode(text, text, text), public.cs_group_wishes(text) to anon, authenticated;
