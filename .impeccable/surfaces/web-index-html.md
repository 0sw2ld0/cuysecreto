---
version: 1
slug: "web-index-html"
primary_target: "web/index.html"
related_targets: []
---

# CuySecreto web app (index.html)

Scope: toda la app web mobile-first (inicio, crear evento, panel del organizador, entrar con código + nombre + PIN, mi lista de deseos, resultado del sorteo con la lista de la otra persona). Modo: Operate.

Audiencia y tarea: grupos peruanos que juegan amigo secreto; el participante entra desde WhatsApp en el celular, crea su PIN, arma su lista con tienda y precio en S/, y luego ve a quién le tocó. El organizador crea el evento, agrega nombres y sortea sin ver parejas.

Momento memorable: la etiqueta «PARA / TE TOCÓ» que se voltea para revelar el nombre.

## Direction contract

THESIS: Cada pantalla es un regalo envuelto: papel cobalto como cáscara de la app, etiquetas de cartulina como tarjetas de trabajo. Rechaza la app blanca con rojo/verde navideño, copos y emojis de regalo.

OWN-WORLD: Fondo papel de regalo cobalto #1f3fd0 con estampado fino de puntos (blanco y amarillo, muy tenue). Superficies blancas tipo etiqueta con ojal (círculo cobalto con anillo amarillo) y esquinas superiores cortadas. Tinta azul noche #10142b. Fucsia #ff3d8b = cinta: acción primaria y pita. Amarillo #ffc93c = precio y estado. Archivo (ancho condensado para títulos) para UI; Kalam para lo escrito a mano: nombres en etiquetas y precios.

STORY: El visitante entiende al instante en qué grupo está, qué le toca hacer ahora (un solo siguiente paso), y cuando hay sorteo ve el nombre y la lista de deseos con dónde comprar y cuánto cuesta.

FIRST VIEWPORT: Barra con marca CuySecreto y código del grupo en píldora. Título del evento en blanco. Franja segmentada blanca: presupuesto, intercambio, grupo (cifras tabulares). Etiqueta grande colgando de pita fucsia con PARA: nombre / TE TOCÓ: ???. Botón fucsia de ancho completo con el siguiente paso. Debajo, lista de deseos como filas-etiqueta con precio en placa amarilla.

FORM: Papel de regalo y etiqueta Para/De; candidato 3 de 7 en mi lista ordenada. seed:b8b415d537398d67. Raises: una sola próxima decisión por pantalla (señalética amarilla); segmentos rotulados con cifras tabulares (tarjeta de embarque); estados que cambian en su fila sin mover la grilla (split-flap).

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

Signature interaction: volteo 3D de la etiqueta con leve balanceo de la pita al revelar; respeta prefers-reduced-motion (fundido).

Unresolved: dónde se hospedan los estáticos.
