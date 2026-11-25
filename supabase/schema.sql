-- CuySecreto · esquema para Supabase (Postgres)
-- Pégalo completo en Supabase → SQL Editor → Run. Es idempotente para las funciones;
-- las tablas se crean solo si no existen.
--
-- Modelo de seguridad:
--   * Todas las tablas tienen RLS activado y NINGUNA política: la clave pública (anon)
--     no puede leer ni escribir tablas directamente.
--   * Todo pasa por funciones RPC "security definer" que validan un token:
--       - token de organizador (admin) por evento
--       - token de sesión por participante (se obtiene con código + nombre + PIN)
--   * Los tokens y PINs se guardan solo como hash.
--   * Nadie (ni el organizador) puede leer las parejas del sorteo: solo cada
--     participante ve a quién le tocó, con su propio token.

create schema if not exists extensions;
create extension if not exists pgcrypto with schema extensions;

-- ───────────────────────── Tablas ─────────────────────────

create table if not exists public.cs_events (
  id             uuid primary key default gen_random_uuid(),
  code           text not null unique,
  name           text not null check (char_length(name) between 1 and 80),
  budget         numeric(10,2) check (budget is null or budget >= 0),
  currency       text not null default 'PEN' check (currency in ('PEN','USD','EUR','MXN','COP','CLP','ARS','BOB')),
  exchange_date  date,
  note           text check (note is null or char_length(note) <= 300),
  admin_hash     text not null,
  drawn_at       timestamptz,
  created_at     timestamptz not null default now()
);

-- Modo de sorteo: 'app' (la app sortea y guarda el secreto) o 'manual' (el grupo ya sorteó
-- por su cuenta; la app solo sirve para las listas de deseos y todos ven las de todos).
alter table public.cs_events add column if not exists draw_mode text not null default 'app';
do $$ begin
  alter table public.cs_events add constraint cs_events_draw_mode_check check (draw_mode in ('app','manual'));
exception when duplicate_object then null; end $$;

-- Si el organizador lo activa, todos ven las listas de todos aunque la app haga el sorteo
-- (ver listas no revela quién le regala a quién).
alter table public.cs_events add column if not exists lists_public boolean not null default false;

create table if not exists public.cs_participants (
  id              uuid primary key default gen_random_uuid(),
  event_id        uuid not null references public.cs_events(id) on delete cascade,
  name            text not null check (char_length(name) between 1 and 40),
  pin_hash        text,
  failed_attempts int not null default 0,
  locked_until    timestamptz,
  joined_at       timestamptz,
  revealed_at     timestamptz,
  receiver_id     uuid references public.cs_participants(id) on delete set null,
  created_at      timestamptz not null default now()
);
create unique index if not exists cs_participants_event_name
  on public.cs_participants (event_id, lower(name));

create table if not exists public.cs_sessions (
  token_hash      text primary key,
  participant_id  uuid not null references public.cs_participants(id) on delete cascade,
  created_at      timestamptz not null default now(),
  last_seen_at    timestamptz not null default now()
);

create table if not exists public.cs_exclusions (
  event_id  uuid not null references public.cs_events(id) on delete cascade,
  a_id      uuid not null references public.cs_participants(id) on delete cascade,
  b_id      uuid not null references public.cs_participants(id) on delete cascade,
  primary key (event_id, a_id, b_id),
  check (a_id < b_id)
);

create table if not exists public.cs_wishes (
  id              uuid primary key default gen_random_uuid(),
  participant_id  uuid not null references public.cs_participants(id) on delete cascade,
  title           text not null check (char_length(title) between 1 and 120),
  note            text check (note is null or char_length(note) <= 300),
  store           text check (store is null or char_length(store) <= 120),
  url             text check (url is null or (char_length(url) <= 600 and url ~* '^https?://')),
  price           numeric(10,2) check (price is null or price >= 0),
  priority        smallint not null default 2 check (priority between 1 and 3),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index if not exists cs_wishes_participant on public.cs_wishes (participant_id);

alter table public.cs_events       enable row level security;
alter table public.cs_participants enable row level security;
alter table public.cs_sessions     enable row level security;
alter table public.cs_exclusions   enable row level security;
alter table public.cs_wishes       enable row level security;

revoke all on public.cs_events, public.cs_participants, public.cs_sessions,
              public.cs_exclusions, public.cs_wishes from anon, authenticated;

-- ───────────────────────── Utilidades internas ─────────────────────────

create or replace function public.cs__hash(p text) returns text
language sql immutable set search_path = public, extensions as $$
  select encode(extensions.digest(p, 'sha256'), 'hex')
$$;

create or replace function public.cs__token() returns text
language sql volatile set search_path = public, extensions as $$
  select encode(extensions.gen_random_bytes(24), 'hex')
$$;

create or replace function public.cs__clean(p text) returns text
language sql immutable as $$
  select nullif(btrim(regexp_replace(coalesce(p, ''), '\s+', ' ', 'g')), '')
$$;

create or replace function public.cs__admin_event(p_code text, p_token text)
returns public.cs_events
language plpgsql stable security definer set search_path = public, extensions as $$
declare e public.cs_events;
begin
  select * into e from cs_events
   where code = upper(btrim(p_code)) and admin_hash = cs__hash(coalesce(p_token, ''));
  if e.id is null then
    raise exception 'Enlace de organizador no válido' using errcode = 'P0001', hint = 'admin_invalid';
  end if;
  return e;
end $$;

create or replace function public.cs__session(p_token text)
returns public.cs_participants
language plpgsql security definer set search_path = public, extensions as $$
declare s cs_sessions; p cs_participants;
begin
  select * into s from cs_sessions where token_hash = cs__hash(coalesce(p_token, ''));
  if s.token_hash is null then
    raise exception 'Tu sesión expiró. Vuelve a entrar con tu PIN.' using errcode = 'P0001', hint = 'session_invalid';
  end if;
  update cs_sessions set last_seen_at = now() where token_hash = s.token_hash;
  select * into p from cs_participants where id = s.participant_id;
  return p;
end $$;

create or replace function public.cs__wishes_json(p_participant uuid) returns json
language sql stable security definer set search_path = public as $$
  select coalesce(json_agg(json_build_object(
           'id', w.id, 'title', w.title, 'note', w.note, 'store', w.store,
           'url', w.url, 'price', w.price, 'priority', w.priority)
         order by w.priority asc, w.created_at asc), '[]'::json)
    from cs_wishes w where w.participant_id = p_participant
$$;

create or replace function public.cs__event_json(e public.cs_events) returns json
language sql stable as $$
  select json_build_object(
    'code', e.code, 'name', e.name, 'budget', e.budget, 'currency', e.currency,
    'exchange_date', e.exchange_date, 'note', e.note, 'drawn', e.drawn_at is not null,
    'drawn_at', e.drawn_at, 'draw_mode', e.draw_mode, 'lists_public', e.lists_public)
$$;

-- ───────────────────────── Organizador ─────────────────────────

create or replace function public.cs_create_event(
  p_name text, p_budget numeric, p_currency text, p_exchange_date date,
  p_note text, p_participants text[]
) returns json
language plpgsql volatile security definer set search_path = public, extensions as $$
declare
  v_code text; v_token text; v_id uuid; v_name text; v_count int := 0;
  alphabet constant text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  i int;
begin
  if cs__clean(p_name) is null then
    raise exception 'Ponle un nombre al grupo' using errcode = 'P0001';
  end if;
  loop
    v_code := 'CUY-';
    for i in 1..5 loop
      v_code := v_code || substr(alphabet, 1 + floor(random() * length(alphabet))::int, 1);
    end loop;
    exit when not exists (select 1 from cs_events where code = v_code);
  end loop;
  v_token := cs__token();

  insert into cs_events (code, name, budget, currency, exchange_date, note, admin_hash)
  values (v_code, cs__clean(p_name), p_budget, coalesce(nullif(p_currency, ''), 'PEN'),
          p_exchange_date, cs__clean(p_note), cs__hash(v_token))
  returning id into v_id;

  foreach v_name in array coalesce(p_participants, '{}') loop
    v_name := cs__clean(v_name);
    continue when v_name is null;
    insert into cs_participants (event_id, name) values (v_id, left(v_name, 40))
    on conflict do nothing;
    v_count := v_count + 1;
  end loop;

  if v_count > 60 then
    raise exception 'Máximo 60 participantes por grupo' using errcode = 'P0001';
  end if;

  return json_build_object('code', v_code, 'admin_token', v_token);
end $$;

create or replace function public.cs_admin_get(p_code text, p_token text) returns json
language plpgsql security definer set search_path = public, extensions as $$
declare e cs_events;
begin
  e := cs__admin_event(p_code, p_token);
  return json_build_object(
    'event', cs__event_json(e),
    'participants', (
      select coalesce(json_agg(json_build_object(
               'id', p.id, 'name', p.name,
               'joined', p.joined_at is not null,
               'has_pin', p.pin_hash is not null,
               'locked', p.locked_until is not null and p.locked_until > now(),
               'wishes', (select count(*) from cs_wishes w where w.participant_id = p.id),
               'revealed', p.revealed_at is not null)
             order by p.created_at, p.name), '[]'::json)
        from cs_participants p where p.event_id = e.id),
    'exclusions', (
      select coalesce(json_agg(json_build_object('a', x.a_id, 'b', x.b_id)), '[]'::json)
        from cs_exclusions x where x.event_id = e.id)
  );
end $$;

create or replace function public.cs_admin_update_event(
  p_code text, p_token text, p_name text, p_budget numeric, p_currency text,
  p_exchange_date date, p_note text
) returns json
language plpgsql security definer set search_path = public, extensions as $$
declare e cs_events;
begin
  e := cs__admin_event(p_code, p_token);
  if cs__clean(p_name) is null then
    raise exception 'Ponle un nombre al grupo' using errcode = 'P0001';
  end if;
  update cs_events set name = cs__clean(p_name), budget = p_budget,
         currency = coalesce(nullif(p_currency, ''), currency),
         exchange_date = p_exchange_date, note = cs__clean(p_note)
   where id = e.id;
  return cs_admin_get(p_code, p_token);
end $$;

-- Cambia entre sorteo en la app y sorteo hecho a mano. No se puede pasar a manual si la app
-- ya sorteó (habría resultados guardados que nadie usaría).
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

create or replace function public.cs_admin_set_lists_public(p_code text, p_token text, p_on boolean)
returns json
language plpgsql security definer set search_path = public, extensions as $$
declare e cs_events;
begin
  e := cs__admin_event(p_code, p_token);
  update cs_events set lists_public = coalesce(p_on, false) where id = e.id;
  return cs_admin_get(p_code, p_token);
end $$;

create or replace function public.cs_admin_add_participant(p_code text, p_token text, p_name text)
returns json
language plpgsql security definer set search_path = public, extensions as $$
declare e cs_events; v_name text := left(cs__clean(p_name), 40);
begin
  e := cs__admin_event(p_code, p_token);
  if e.drawn_at is not null then
    raise exception 'El sorteo ya se hizo. Deshazlo para agregar a alguien.' using errcode = 'P0001';
  end if;
  if v_name is null then
    raise exception 'Escribe un nombre' using errcode = 'P0001';
  end if;
  if (select count(*) from cs_participants where event_id = e.id) >= 60 then
    raise exception 'Máximo 60 participantes por grupo' using errcode = 'P0001';
  end if;
  begin
    insert into cs_participants (event_id, name) values (e.id, v_name);
  exception when unique_violation then
    raise exception 'Ya hay alguien llamado %', v_name using errcode = 'P0001';
  end;
  return cs_admin_get(p_code, p_token);
end $$;

create or replace function public.cs_admin_remove_participant(p_code text, p_token text, p_participant uuid)
returns json
language plpgsql security definer set search_path = public, extensions as $$
declare e cs_events;
begin
  e := cs__admin_event(p_code, p_token);
  if e.drawn_at is not null then
    raise exception 'El sorteo ya se hizo. Deshazlo para quitar a alguien.' using errcode = 'P0001';
  end if;
  delete from cs_participants where id = p_participant and event_id = e.id;
  return cs_admin_get(p_code, p_token);
end $$;

create or replace function public.cs_admin_reset_pin(p_code text, p_token text, p_participant uuid)
returns json
language plpgsql security definer set search_path = public, extensions as $$
declare e cs_events;
begin
  e := cs__admin_event(p_code, p_token);
  update cs_participants set pin_hash = null, failed_attempts = 0, locked_until = null
   where id = p_participant and event_id = e.id;
  delete from cs_sessions where participant_id = p_participant;
  return cs_admin_get(p_code, p_token);
end $$;

create or replace function public.cs_admin_toggle_exclusion(p_code text, p_token text, p_a uuid, p_b uuid)
returns json
language plpgsql security definer set search_path = public, extensions as $$
declare e cs_events; lo uuid := least(p_a, p_b); hi uuid := greatest(p_a, p_b);
begin
  e := cs__admin_event(p_code, p_token);
  if e.drawn_at is not null then
    raise exception 'El sorteo ya se hizo. Deshazlo para cambiar las parejas excluidas.' using errcode = 'P0001';
  end if;
  if lo = hi then raise exception 'Elige dos personas distintas' using errcode = 'P0001'; end if;
  if (select count(*) from cs_participants where event_id = e.id and id in (lo, hi)) <> 2 then
    raise exception 'Participante no válido' using errcode = 'P0001';
  end if;
  if exists (select 1 from cs_exclusions where event_id = e.id and a_id = lo and b_id = hi) then
    delete from cs_exclusions where event_id = e.id and a_id = lo and b_id = hi;
  else
    insert into cs_exclusions (event_id, a_id, b_id) values (e.id, lo, hi);
  end if;
  return cs_admin_get(p_code, p_token);
end $$;

-- Sorteo: arma un solo ciclo aleatorio (A→B→C→…→A), así nadie se toca a sí mismo
-- ni quedan parejas cerradas de dos; respeta las exclusiones (en ambos sentidos).
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

-- Deshacer el sorteo solo si nadie ha visto su resultado (para no romper el secreto).
create or replace function public.cs_admin_undo_draw(p_code text, p_token text) returns json
language plpgsql security definer set search_path = public, extensions as $$
declare e cs_events;
begin
  e := cs__admin_event(p_code, p_token);
  if exists (select 1 from cs_participants where event_id = e.id and revealed_at is not null) then
    raise exception 'Alguien ya vio su resultado; deshacer el sorteo arruinaría el secreto.' using errcode = 'P0001';
  end if;
  update cs_participants set receiver_id = null where event_id = e.id;
  update cs_events set drawn_at = null where id = e.id;
  return cs_admin_get(p_code, p_token);
end $$;

-- ───────────────────────── Participante ─────────────────────────

create or replace function public.cs_event_public(p_code text) returns json
language plpgsql stable security definer set search_path = public, extensions as $$
declare e cs_events;
begin
  select * into e from cs_events where code = upper(btrim(p_code));
  if e.id is null then
    raise exception 'No encontramos un grupo con ese código' using errcode = 'P0001', hint = 'event_not_found';
  end if;
  return json_build_object(
    'event', cs__event_json(e),
    'participants', (
      select coalesce(json_agg(json_build_object('id', p.id, 'name', p.name, 'has_pin', p.pin_hash is not null)
             order by lower(p.name)), '[]'::json)
        from cs_participants p where p.event_id = e.id));
end $$;

create or replace function public.cs_join(p_code text, p_participant uuid, p_pin text) returns json
language plpgsql volatile security definer set search_path = public, extensions as $$
declare e cs_events; p cs_participants; v_token text; v_new boolean := false;
begin
  select * into e from cs_events where code = upper(btrim(p_code));
  if e.id is null then
    raise exception 'No encontramos un grupo con ese código' using errcode = 'P0001', hint = 'event_not_found';
  end if;
  select * into p from cs_participants where id = p_participant and event_id = e.id for update;
  if p.id is null then
    raise exception 'Ese nombre no está en el grupo' using errcode = 'P0001';
  end if;
  if coalesce(p_pin, '') !~ '^[0-9]{4}$' then
    raise exception 'El PIN debe tener 4 números' using errcode = 'P0001';
  end if;
  if p.locked_until is not null and p.locked_until > now() then
    raise exception 'Demasiados intentos. Espera unos minutos o pide al organizador que reinicie tu PIN.'
      using errcode = 'P0001', hint = 'locked';
  end if;

  if p.pin_hash is null then
    update cs_participants
       set pin_hash = extensions.crypt(p_pin, extensions.gen_salt('bf', 8)),
           joined_at = coalesce(joined_at, now()), failed_attempts = 0, locked_until = null
     where id = p.id;
    v_new := true;
  elsif p.pin_hash = extensions.crypt(p_pin, p.pin_hash) then
    update cs_participants set failed_attempts = 0, locked_until = null,
           joined_at = coalesce(joined_at, now()) where id = p.id;
  else
    update cs_participants
       set failed_attempts = case when p.failed_attempts + 1 >= 5 then 0 else p.failed_attempts + 1 end,
           locked_until   = case when p.failed_attempts + 1 >= 5 then now() + interval '15 minutes' end
     where id = p.id;
    return json_build_object('ok', false,
      'error', case when p.failed_attempts + 1 >= 5
                    then 'Demasiados intentos. Espera 15 minutos o pide al organizador que reinicie tu PIN.'
                    when p.failed_attempts + 1 = 4 then 'PIN incorrecto. Te queda 1 intento.'
                    else 'PIN incorrecto. Te quedan ' || (5 - p.failed_attempts - 1) || ' intentos.' end);
  end if;

  v_token := cs__token();
  insert into cs_sessions (token_hash, participant_id) values (cs__hash(v_token), p.id);
  return json_build_object('ok', true, 'token', v_token, 'created_pin', v_new, 'name', p.name);
end $$;

create or replace function public.cs_me(p_token text) returns json
language plpgsql volatile security definer set search_path = public, extensions as $$
declare p cs_participants; e cs_events; r cs_participants;
begin
  p := cs__session(p_token);
  select * into e from cs_events where id = p.event_id;
  if p.revealed_at is not null and p.receiver_id is not null then
    select * into r from cs_participants where id = p.receiver_id;
  end if;
  return json_build_object(
    'event', cs__event_json(e),
    'me', json_build_object('id', p.id, 'name', p.name, 'wishes', cs__wishes_json(p.id)),
    'group_size', (select count(*) from cs_participants where event_id = e.id),
    'revealed', r.id is not null,
    'receiver', case when r.id is null then null else
      json_build_object('name', r.name, 'wishes', cs__wishes_json(r.id)) end);
end $$;

create or replace function public.cs_reveal(p_token text) returns json
language plpgsql volatile security definer set search_path = public, extensions as $$
declare p cs_participants;
begin
  p := cs__session(p_token);
  if p.receiver_id is null then
    raise exception 'El organizador todavía no hace el sorteo' using errcode = 'P0001', hint = 'not_drawn';
  end if;
  update cs_participants set revealed_at = coalesce(revealed_at, now()) where id = p.id;
  return cs_me(p_token);
end $$;

-- Grupos con sorteo a mano, o con "listas para todos" activado: cada participante (con su sesión)
-- ve las listas de todos los demás. Nunca devuelve parejas del sorteo.
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

create or replace function public.cs_wish_save(
  p_token text, p_id uuid, p_title text, p_note text, p_store text, p_url text,
  p_price numeric, p_priority smallint
) returns json
language plpgsql volatile security definer set search_path = public, extensions as $$
declare p cs_participants; v_url text := cs__clean(p_url);
begin
  p := cs__session(p_token);
  if cs__clean(p_title) is null then
    raise exception 'Escribe qué te gustaría recibir' using errcode = 'P0001';
  end if;
  if v_url is not null and v_url !~* '^https?://' then
    v_url := 'https://' || v_url;
  end if;
  if p_id is null then
    if (select count(*) from cs_wishes where participant_id = p.id) >= 20 then
      raise exception 'Máximo 20 deseos por persona' using errcode = 'P0001';
    end if;
    insert into cs_wishes (participant_id, title, note, store, url, price, priority)
    values (p.id, left(cs__clean(p_title), 120), left(cs__clean(p_note), 300), left(cs__clean(p_store), 120),
            v_url, p_price, coalesce(p_priority, 2));
  else
    update cs_wishes set title = left(cs__clean(p_title), 120), note = left(cs__clean(p_note), 300),
           store = left(cs__clean(p_store), 120), url = v_url, price = p_price,
           priority = coalesce(p_priority, 2), updated_at = now()
     where id = p_id and participant_id = p.id;
  end if;
  return cs_me(p_token);
end $$;

create or replace function public.cs_wish_delete(p_token text, p_id uuid) returns json
language plpgsql volatile security definer set search_path = public, extensions as $$
declare p cs_participants;
begin
  p := cs__session(p_token);
  delete from cs_wishes where id = p_id and participant_id = p.id;
  return cs_me(p_token);
end $$;

create or replace function public.cs_logout(p_token text) returns json
language sql volatile security definer set search_path = public, extensions as $$
  delete from cs_sessions where token_hash = cs__hash(coalesce(p_token, ''));
  select json_build_object('ok', true);
$$;

-- ───────────────────────── Permisos ─────────────────────────

-- Solo se tocan las funciones de CuySecreto (prefijo cs_), nunca otras de tu proyecto.
do $$
declare f record;
begin
  for f in select p.oid::regprocedure as sig from pg_proc p
            join pg_namespace n on n.oid = p.pronamespace
           where n.nspname = 'public' and p.proname like 'cs\_%'
  loop
    execute format('revoke execute on function %s from public, anon, authenticated', f.sig);
  end loop;
end $$;

grant execute on function
  public.cs_create_event(text, numeric, text, date, text, text[]),
  public.cs_admin_get(text, text),
  public.cs_admin_update_event(text, text, text, numeric, text, date, text),
  public.cs_admin_set_draw_mode(text, text, text),
  public.cs_admin_set_lists_public(text, text, boolean),
  public.cs_group_wishes(text),
  public.cs_admin_add_participant(text, text, text),
  public.cs_admin_remove_participant(text, text, uuid),
  public.cs_admin_reset_pin(text, text, uuid),
  public.cs_admin_toggle_exclusion(text, text, uuid, uuid),
  public.cs_admin_draw(text, text),
  public.cs_admin_undo_draw(text, text),
  public.cs_event_public(text),
  public.cs_join(text, uuid, text),
  public.cs_me(text),
  public.cs_reveal(text),
  public.cs_wish_save(text, uuid, text, text, text, text, numeric, smallint),
  public.cs_wish_delete(text, uuid),
  public.cs_logout(text)
to anon, authenticated;
