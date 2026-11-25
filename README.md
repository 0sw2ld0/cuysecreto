# CuySecreto

Amigo secreto para el celular: el organizador crea el grupo y sortea; cada participante entra con **código del grupo + su nombre + PIN de 4 números**, arma su lista de deseos (qué, dónde conseguirlo, precio en S/) y ve a quién le tocó con la lista de esa persona. Nadie, ni el organizador, ve las parejas.

- `web/` — la página (HTML/CSS/JS sin dependencias ni build). Se sirve tal cual.
- `supabase/schema.sql` — tablas y funciones. Todo el acceso es por funciones RPC con token; las tablas están cerradas con RLS.
- `dev/` — entorno local que imita Supabase (Postgres + PostgREST en Docker) y un servidor de desarrollo.
- `deploy/nginx.conf` — ejemplo para servir `cuysecreto.cuycoders.dev`.

## Probar en local

```bash
docker compose -f dev/docker-compose.yml up -d
```

```bash
LOCAL_API=1 node dev/serve.mjs
```

Abre http://localhost:5173. Sin `LOCAL_API=1` la página local usa el Supabase real de `web/config.js`. `dev/api-test.sh` prueba la API de punta a punta (contra Supabase: `API=https://<ref>.supabase.co/rest/v1 KEY=<publishable> dev/api-test.sh`).

Proyecto Supabase en uso: `cuysecreto` (ref `sxezzwcygwtlqbdrslrr`, São Paulo). El esquema ya está aplicado.

## Publicar

La web está en **GitHub Pages**: cada push a `main` que toque `web/` la publica sola (`.github/workflows/pages.yml`) en https://cuysecreto.cuycoders.dev. El dominio sale de `web/CNAME`, y en Cloudflare `cuysecreto` es un CNAME a `0sw2ld0.github.io` (DNS only).

Desde cero, o para usar tu propio servidor en lugar de Pages:

1. **Supabase**: en el proyecto, SQL Editor → pega `supabase/schema.sql` → Run.
2. **Configura** `web/config.js`:
   ```js
   window.CUY_CONFIG = {
     apiUrl: "https://<ref>.supabase.co/rest/v1",
     anonKey: "<clave publishable o anon>",
   };
   ```
   La clave publishable/anon es pública por diseño; nunca pongas la `service_role` / `secret`.
3. **Sube `web/`** a tu servidor (por ejemplo `/var/www/cuysecreto`) y usa `deploy/nginx.conf`.
4. **DNS**: registro `A` (o `CNAME`) de `cuysecreto.cuycoders.dev` hacia tu servidor, y HTTPS con certbot.

## Seguridad en corto

- PIN con bcrypt; 5 intentos fallidos bloquean 15 minutos. El organizador puede reiniciar un PIN olvidado.
- Tokens de sesión y de organizador guardados solo como hash SHA-256.
- El sorteo arma un solo ciclo aleatorio (nadie se toca a sí mismo) y respeta exclusiones en ambos sentidos.
- Solo se puede deshacer el sorteo si nadie vio su resultado.
- Quien tenga el código del grupo puede ver los nombres y reclamar un nombre que aún no tenga PIN: compártelo solo en el grupo.
