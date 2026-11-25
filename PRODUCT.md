# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Frontend estático (HTML/CSS/JS sin framework, sin paso de build) servido en `cuysecreto.cuycoders.dev`. Datos en Supabase (Postgres): tablas con RLS cerrado y todo el acceso por funciones RPC `security definer`; el navegador solo usa la clave pública (anon/publishable). Elegido por el usuario: Supabase. Dónde se sirven los estáticos: abierto (su servidor, o Pages/Vercel).

## Users

Grupos peruanos (familia, oficina, amigos) que organizan un amigo secreto, sobre todo en Navidad. Dos roles:
- **Organizador:** cualquiera; crea el evento, agrega los nombres, comparte el código por WhatsApp y lanza el sorteo. Usa el celular.
- **Participante:** abre el enlace o escribe el código del grupo, elige su nombre, crea un PIN de 4 dígitos, arma su lista de deseos y luego ve a quién le tocó. Vuelve varias veces en semanas, a menudo desde otro celular, y necesita recuperar todo con código + nombre + PIN.

## Product Purpose

Que el sorteo sea justo y secreto (nadie, ni el organizador, ve las parejas) y que cada uno sepa qué regalarle a quien le tocó: su lista de deseos con dónde comprarlo y cuánto cuesta. Éxito: todos ven su resultado sin pedírselo al organizador y compran algo que la otra persona sí quería.

## Positioning

Amigo secreto hecho en casa por CuyCoders: lista de deseos con tienda y precio en soles, recuperación con código + nombre + PIN sin cuentas ni correos, y pensado para compartirse por WhatsApp.

## Operating Context

Se comparte el código o el enlace en un grupo de WhatsApp. Se abre en el celular, a veces en la reunión misma. Hay presupuesto (monto máximo) y fecha del intercambio. Las tiendas típicas son en línea (Falabella, Ripley, Mercado Libre, Amazon) o físicas (Gamarra, Polvos Azules, un centro comercial).

## Capabilities and Constraints

- Cualquiera crea eventos; el organizador recibe un enlace secreto de administración.
- Código corto por evento; acceso del participante con nombre + PIN (hash en servidor, bloqueo tras intentos fallidos).
- Lista de deseos por persona: nombre del regalo, nota (talla, color), tienda/lugar, enlace, precio en S/ (opcional), prioridad.
- Exclusiones opcionales (parejas que no deben tocarse).
- Sorteo en el servidor; el organizador solo ve quién ya entró y quién ya vio su resultado, nunca las parejas.
- Moneda por defecto: soles (S/); cada evento puede cambiarla.
- Interfaz en español (Perú).

## Brand Commitments

Nombre: **CuySecreto**, de la familia CuyCoders (cuycoders.dev). Tono cercano y peruano, sin ser chabacano.

## Evidence on Hand

No hay logo, fotos ni testimonios. No inventar usuarios, cifras ni tiendas asociadas.

## Product Principles

1. El secreto es sagrado: nada en la interfaz ni en la API revela parejas a quien no corresponde.
2. Recuperable siempre: perder el enlace nunca deja a nadie sin su resultado.
3. Celular primero, un pulgar, conexión floja.
4. La lista de deseos es útil para comprar: dónde y cuánto, no solo qué.

## Accessibility & Inclusion

Usuarios de todas las edades (abuelos incluidos): texto grande, contraste AA, objetivos táctiles de 44px, sin depender del color.
