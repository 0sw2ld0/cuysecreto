-- Simula los roles de Supabase para pruebas locales
create role anon nologin;
create role authenticated nologin;
create role authenticator login password 'dev' noinherit;
grant anon, authenticated to authenticator;
grant usage on schema public to anon, authenticated;
