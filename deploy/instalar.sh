#!/bin/sh
# Instala/actualiza CuySecreto en el servidor. Ejecutar con: sudo sh ~/cuysecreto/instalar.sh
set -eu
SRC="$(dirname "$0")/web"
install -d -m 755 /srv/cuysecreto
cp -r "$SRC"/. /srv/cuysecreto/
chown -R root:root /srv/cuysecreto
find /srv/cuysecreto -type d -exec chmod 755 {} +
find /srv/cuysecreto -type f -exec chmod 644 {} +
if ! grep -q "cuysecreto.cuycoders.dev" /etc/caddy/Caddyfile; then
  cp /etc/caddy/Caddyfile "/etc/caddy/Caddyfile.antes-cuysecreto.$(date +%Y%m%d%H%M%S)"
  cat "$(dirname "$0")/Caddyfile.cuysecreto" >> /etc/caddy/Caddyfile
fi
caddy validate --config /etc/caddy/Caddyfile --adapter caddyfile
systemctl reload caddy
echo "Listo: https://cuysecreto.cuycoders.dev"
