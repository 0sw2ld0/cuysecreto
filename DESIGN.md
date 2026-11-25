---
name: CuySecreto
description: Amigo secreto envuelto en papel de regalo cobalto, con etiquetas Para/De escritas a mano.
colors:
  paper: "#1f3fd0"
  paper-deep: "#1532a8"
  paper-ink: "#c9d3ff"
  tag: "#ffffff"
  tag-edge: "#dfe3f3"
  tag-wash: "#eef0f8"
  ink: "#10142b"
  ink-2: "#474e70"
  ribbon: "#ff3d8b"
  ribbon-strong: "#d81468"
  ribbon-press: "#b80f57"
  gold: "#ffc93c"
  gold-soft: "#fff1c7"
  ok: "#157a4a"
  ok-soft: "#dcf3e6"
  danger: "#c0262d"
  danger-soft: "#fde4e4"
typography:
  display:
    fontFamily: "Archivo, system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "clamp(40px, 12vw, 58px)"
    fontWeight: 800
    lineHeight: 1.02
    letterSpacing: "-0.01em"
    fontVariation: "'wdth' 72"
  headline:
    fontFamily: "Archivo, system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "clamp(32px, 9vw, 44px)"
    fontWeight: 800
    lineHeight: 1.02
    letterSpacing: "-0.01em"
    fontVariation: "'wdth' 72"
  title:
    fontFamily: "Archivo, system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "24px"
    fontWeight: 800
    lineHeight: 1.1
    fontVariation: "'wdth' 72"
  tag-title:
    fontFamily: "Archivo, system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "22px"
    fontWeight: 800
    lineHeight: 1.1
    fontVariation: "'wdth' 85"
  body:
    fontFamily: "Archivo, system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "17px"
    fontWeight: 400
    lineHeight: 1.45
  label:
    fontFamily: "Archivo, system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "11px"
    fontWeight: 800
    letterSpacing: "0.1em"
  hand-name:
    fontFamily: "Kalam, cursive"
    fontSize: "clamp(26px, 8vw, 34px)"
    fontWeight: 700
    lineHeight: 1.15
  hand-name-big:
    fontFamily: "Kalam, cursive"
    fontSize: "clamp(40px, 13vw, 58px)"
    fontWeight: 700
    lineHeight: 1.05
  hand-price:
    fontFamily: "Kalam, cursive"
    fontSize: "22px"
    fontWeight: 700
    lineHeight: 1
    fontFeature: "'tnum' 1"
rounded:
  plate: "8px"
  tag: "10px"
  card: "12px"
  button: "14px"
  pill: "999px"
spacing:
  xs: "6px"
  sm: "8px"
  md: "12px"
  gutter: "16px"
  lg: "24px"
  section: "34px"
components:
  button-primary:
    backgroundColor: "{colors.ribbon-strong}"
    textColor: "{colors.tag}"
    rounded: "{rounded.button}"
    padding: "12px 20px"
    height: "52px"
  button-primary-hover:
    backgroundColor: "{colors.ribbon-press}"
  button-light:
    backgroundColor: "{colors.tag}"
    textColor: "{colors.ink}"
    rounded: "{rounded.button}"
    padding: "12px 20px"
    height: "52px"
  button-ghost:
    textColor: "{colors.tag}"
    rounded: "{rounded.button}"
    padding: "12px 20px"
    height: "52px"
  button-sm:
    rounded: "{rounded.tag}"
    padding: "8px 12px"
    height: "40px"
  input:
    backgroundColor: "{colors.tag}"
    textColor: "{colors.ink}"
    rounded: "{rounded.tag}"
    padding: "12px 14px"
    height: "50px"
  tag-card:
    backgroundColor: "{colors.tag}"
    textColor: "{colors.ink}"
    rounded: "{rounded.tag}"
    padding: "44px 20px 20px"
  segment-strip:
    backgroundColor: "{colors.tag}"
    textColor: "{colors.ink}"
    rounded: "{rounded.card}"
    padding: "10px 12px"
  price-plate:
    backgroundColor: "{colors.gold}"
    textColor: "{colors.ink}"
    typography: "{typography.hand-price}"
    rounded: "{rounded.plate}"
    padding: "6px 10px 4px"
  chip:
    backgroundColor: "{colors.tag-wash}"
    textColor: "{colors.ink}"
    rounded: "{rounded.pill}"
    padding: "6px 6px 6px 14px"
    height: "40px"
  status-chip-on:
    backgroundColor: "{colors.ok-soft}"
    textColor: "{colors.ok}"
    rounded: "{rounded.pill}"
    padding: "2px 8px"
  code-pill:
    textColor: "{colors.tag}"
    rounded: "{rounded.pill}"
    padding: "6px 12px"
    height: "36px"
  tab-selected:
    backgroundColor: "{colors.tag}"
    textColor: "{colors.ink}"
    rounded: "{rounded.tag}"
    height: "46px"
---

# Design System: CuySecreto

## Overview

**Creative North Star: "Papel de regalo y etiqueta Para/De"**

Cada pantalla es un regalo envuelto. El papel cobalto es la cáscara de la app: llena todo el fondo, con un estampado fino de puntos blancos y dorados casi imperceptible, y nunca se interrumpe. Encima cuelgan etiquetas de cartulina blanca con las esquinas superiores cortadas y un ojal, y en ellas sucede todo el trabajo: entrar con el código, armar la lista, ver a quién te tocó. Lo impreso habla en Archivo condensado; lo escrito por una persona (nombres, precios) va en Kalam, como si alguien lo hubiera llenado con plumón.

La densidad es de celular y de pulgar: una columna de 540px como máximo, objetivos táctiles de 44px o más, texto base de 17px y una sola acción fucsia por pantalla. La cinta fucsia es a la vez la pita de donde cuelga la etiqueta y el botón del siguiente paso; el dorado marca precio y estado, como señalética. El momento firma es el volteo 3D de la etiqueta «Para: ¿???» que revela el nombre, con un leve balanceo de la pita.

El sistema rechaza la app blanca con rojo y verde navideño, los copos de nieve y los emojis de regalo: la Navidad está en el material (papel, cinta, etiqueta), no en clip art.

**Key Characteristics:**
- Fondo cobalto continuo con estampado de puntos; nada de fondos blancos a pantalla completa.
- Etiquetas blancas con esquinas superiores cortadas y ojal cobalto con anillo dorado como tarjeta de trabajo.
- Archivo condensado (ancho 72–85%) para títulos; Kalam para nombres y placas de precio.
- Fucsia = acción primaria y pita; dorado = precio, estado y foco.
- Cifras tabulares en todo dato numérico (presupuesto, código, precio, PIN).
- Volteo 3D de la etiqueta como revelación; fundido con movimiento reducido.

## Colors

Una paleta de papelería de regalo: un cobalto saturado que envuelve, cartulina blanca que sostiene el contenido, una tinta azul noche y dos acentos de envoltorio (cinta fucsia y dorado de precio).

### Primary
- **Papel Cobalto** (paper): el fondo de toda la app, la barra translúcida y el estampado. También aparece dentro de las etiquetas como color del ojal, del borde de foco de los campos y del nombre aún secreto («¿ ? ? ?»).
- **Cobalto Pliegue** (paper-deep): texto del estado seleccionado en selectores sobre blanco (prioridad elegida).
- **Bruma Cobalto** (paper-ink): texto secundario sobre el papel: lead, subtítulos de sección, enlace «Volver», notas del evento, pestañas no seleccionadas.

### Secondary
- **Cinta Fucsia** (ribbon): la pita decorativa de 2px de la que cuelga cada etiqueta y el lazo del logotipo. Decorativa; no lleva texto.
- **Cinta Fucsia Intensa** (ribbon-strong): fondo del botón primario y anillo de foco dentro de superficies blancas. Es la versión de la cinta que pasa AA con texto blanco.
- **Cinta Fucsia Presionada** (ribbon-press): hover del botón primario.

### Tertiary
- **Dorado de Precio** (gold): placa de precio, anillo del ojal, puntos dorados del estampado, iconos de los pasos y el anillo de foco sobre el papel. También el color de selección de texto.
- **Dorado Suave** (gold-soft): avisos que piden atención sin alarma (espera del sorteo, advertencia del organizador).

### Neutral
- **Cartulina** (tag): etiquetas, paneles, campos, botón claro, pestaña seleccionada, confirmaciones.
- **Canto de Cartulina** (tag-edge): bordes de campos y casillas de PIN, separadores punteados de la franja segmentada, contorno del botón fantasma sobre blanco.
- **Lavado de Cartulina** (tag-wash): relleno de chips, teclas del PIN, estado neutro de las fichas y la placa «Sin precio».
- **Tinta Noche** (ink): todo texto sobre blanco, la línea de escritura bajo los nombres, el toast.
- **Tinta Gris** (ink-2): etiquetas impresas («Para:», «De:»), pistas, metadatos de deseos, iconos en reposo.
- **Semánticos**: verde (ok / ok-soft) para «Entró», «Vio resultado» y prioridad normal; rojo (danger / danger-soft) para errores, bloqueo y botón de borrar. Siempre acompañados de texto o icono.

### Named Rules
**The Una Sola Cinta Rule.** El fucsia intenso de acción aparece en un único botón primario por vista: el siguiente paso. El resto de acciones son claras o fantasma.

**The Dorado Es Precio Rule.** El dorado lleno se reserva para placas de precio, el ojal y el foco. No se usa como fondo de botones ni de bloques grandes; para avisos se usa el dorado suave.

**The Cinta Decorativa Rule.** El fucsia brillante (ribbon) nunca lleva texto blanco encima; para texto sobre fucsia se usa siempre la versión intensa.

## Typography

**Display Font:** Archivo, eje de ancho 62–100 (con system-ui, -apple-system, Segoe UI)
**Body Font:** Archivo (misma familia, ancho normal)
**Hand Font:** Kalam 400/700 (con cursive)

**Character:** Archivo condensado y pesado se lee como la tipografía impresa de una etiqueta comercial; Kalam pone la mano de quien la llena. La tensión impreso/escrito a mano es el sistema: lo que el producto dice va en Archivo, lo que una persona escribió (su nombre, el precio que puso) va en Kalam.

### Hierarchy
- **Display** (800, clamp(40px, 12vw, 58px), 1.02, ancho 72%): solo el titular de inicio.
- **Headline** (800, clamp(32px, 9vw, 44px), 1.02, ancho 72%, text-wrap: balance): nombre del evento o título de vista, en blanco sobre el papel.
- **Title** (800, 24px, 1.1, ancho 72%): títulos de sección sobre el papel, con un contador a la derecha en 15px/600 a ancho normal.
- **Tag Title** (800, 22px, 1.1, ancho 85%): título dentro de una etiqueta.
- **Body** (400, 17px, 1.45; 18px desde 700px): texto corrido; el lead se limita a 34ch. Pistas y metadatos bajan a 15px.
- **Label** (800, 11px, 0.1em, mayúsculas): solo los rótulos de los segmentos de datos del evento (Presupuesto / Intercambio / Grupo), encima de la cifra. Los rótulos de campos van en 14–15px/700 sin mayúsculas.
- **Hand Name** (Kalam 700, clamp(26px, 8vw, 34px); grande clamp(40px, 13vw, 58px)): nombres escritos sobre la línea de la etiqueta y en la lista de participantes.
- **Hand Price** (Kalam 700, 22px, cifras tabulares): placa de precio.
- **Printed** (Kalam 400, 20px, tinta gris): las palabras «Para:» y «De:» delante del nombre.

### Named Rules
**The Impreso y Escrito Rule.** Kalam solo para nombres de personas, precios, «Para/De» y los dígitos del PIN. Nunca para botones, títulos ni párrafos.

**The Cifra Tabular Rule.** Todo número que se compara o se copia (presupuesto, grupo, código, precio, PIN, contadores) usa cifras tabulares.

## Layout

Columna única centrada de 540px como máximo, con canal lateral de 16px (gutter) y 48px de aire al final. La barra superior es pegajosa, con la marca a la izquierda y el código del grupo en píldora a la derecha, y respeta las áreas seguras del dispositivo. Desde 700px solo crece el aire superior (24px) y el texto base (18px); no hay layout de escritorio distinto.

El ritmo vertical se arma con pocos pasos: 8–12px entre elementos de un grupo, 14px entre campos, 16px entre etiquetas apiladas, 24–28px antes de bloques de acciones o pestañas, 34px antes de cada título de sección. Los grupos de botones usan una pila de 12px o una fila que se envuelve con botones de mínimo 140px. Los datos del evento van en una franja de tres segmentos iguales. Los nombres para elegir van en una grilla auto-fill de mínimo 140px.

**The Siguiente Paso Rule.** Cada vista lleva una sola decisión principal, como botón fucsia de ancho completo dentro o justo debajo de la etiqueta.

**The Fila Quieta Rule.** Los estados cambian dentro de su fila (fichas de estado, contadores) sin mover la grilla.

## Elevation & Depth

Profundidad física, no tonal: las etiquetas son objetos que cuelgan sobre el papel y proyectan una sombra suave y difusa hacia abajo. El papel es plano; todo lo blanco flota. Las etiquetas colgantes usan además un drop-shadow sobre el conjunto (para que la sombra siga el recorte de las esquinas), y la barra usa desenfoque translúcido del papel.

### Shadow Vocabulary
- **Etiqueta colgante** (`box-shadow: 0 10px 24px -8px rgba(0,0,0,.45), 0 2px 4px rgba(0,0,0,.18)`): etiquetas, confirmaciones en línea, toast.
- **Cartulina apoyada** (`box-shadow: 0 4px 10px -4px rgba(0,0,0,.35)`): paneles de lista, franja segmentada, botones de nombre, botón claro, pestaña seleccionada.
- **Sombra de cuelgue** (`filter: drop-shadow(0 10px 14px rgba(0,0,0,.28))`): contenedor de la etiqueta colgante y la lista de deseos, para respetar el recorte.
- **Botón primario** (`box-shadow: 0 8px 18px -8px rgba(0,0,0,.45)`): levanta la cinta de acción.

### Named Rules
**The Todo Blanco Flota Rule.** Ninguna superficie blanca se apoya sin sombra sobre el papel; ninguna superficie sobre el papel es cobalto con sombra.

## Shapes

El silueta firma es la etiqueta: rectángulo con las dos esquinas superiores cortadas en diagonal (30px en etiquetas grandes, 22px solo arriba a la derecha en las filas de deseo), radio de 10px abajo, y un ojal circular (18px; 12px en filas) del color del papel con anillo dorado de 4px (3px en filas), como si el papel se viera a través del agujero. De la etiqueta colgante sale la pita: una línea fucsia vertical de 2px.

El resto de la forma es amable y redondeada: 8px para placas, 10px para campos, botones pequeños y etiquetas, 12px para paneles y la franja, 14px para botones grandes y el contenedor de pestañas, y píldora completa para el código del grupo, chips y fichas de estado. La placa de precio se inclina 2° y la etiqueta de inicio −2°, como objetos colocados a mano. Los separadores internos de la franja son discontinuos de 1.5px, como un talón troquelado.

## Components

### Buttons
Táctiles y francos: altos, pesados, sin mayúsculas forzadas.
- **Shape:** curvas amplias (14px); pequeño a 10px.
- **Primary:** fondo cinta fucsia intensa, texto blanco 18px/800, alto mínimo 52px, padding 12px 20px, sombra de botón primario. Normalmente de ancho completo.
- **Hover / Active:** hover a fucsia presionado; al presionar escala 0.98 (150ms, ease-out). Deshabilitado a 50% de opacidad.
- **Light:** cartulina con tinta noche y sombra apoyada, para la segunda acción sobre el papel.
- **Ghost:** transparente con contorno interior de 2px blanco al 55% sobre el papel (hover: blanco pleno); dentro de superficies blancas, tinta noche con contorno canto de cartulina (hover: tinta gris).
- **Danger:** fondo rojo suave con texto rojo.
- **Icon:** 44×44px, transparente, tinta gris; hover con lavado de cartulina.

### Chips
- **Nombre (crear evento):** píldora de 40px en lavado de cartulina, texto 16px/700, con botón circular de 32px para quitar.
- **Estado (organizador):** píldora de 24px, 12px/800, con icono de 13px. Neutro en lavado de cartulina, «on» en verde suave, aviso en rojo suave.
- **Prioridad:** misma píldora; «Lo que más quiero» en rosa con texto vino, normal en verde suave, «Si se puede» neutro.

### Cards / Containers
- **Etiqueta (tag):** la tarjeta de trabajo. Cartulina, tinta noche, esquinas cortadas, ojal, radio 10px, padding 44px 20px 20px (compacta 38px 16px 16px), sombra colgante.
- **Panel:** cartulina sin ojal ni recorte para listas (participantes, exclusiones), radio 12px, sombra apoyada, filas separadas por filetes de 1px muy claros, filas de 56–60px.
- **Confirmación en línea:** cartulina 14px de padding, radio 12px, sombra colgante, aparece bajo la acción que confirma.
- **Vacío:** contorno discontinuo blanco al 40% sobre el papel, radio 12px, título blanco 18px y texto bruma.

### Inputs / Fields
- **Style:** cartulina, borde de 2px canto de cartulina, radio 10px, alto mínimo 50px, texto 17px; textarea desde 96px. Rótulo 14px/700 encima, con la parte opcional en 500 tinta gris.
- **Focus:** borde cobalto y halo cobalto al 15% de 4px.
- **Money:** prefijo de moneda dentro del campo, a 14px, cifras tabulares.
- **Código:** centrado, mayúsculas, 22px/800, tracking 0.12em.
- **Error:** bloque rojo suave con texto rojo 15px/600 sobre el botón; desaparece cuando está vacío.

### Navigation
- **Barra:** pegajosa, papel al 88% con desenfoque y saturación; marca en Archivo 800 ancho 78% a 21px con el lazo de regalo de 28px; a la derecha, píldora blanca al 16% con el código en cifras tabulares (14px/700, 0.04em).
- **Volver:** enlace bruma con chevron, 44px de alto, blanco en hover.
- **Pestañas:** control segmentado de dos opciones sobre negro al 18%, radio 14px; la seleccionada es cartulina con tinta noche y sombra apoyada.

### Franja Segmentada
Tarjeta de embarque del evento: tres segmentos iguales en cartulina con separadores discontinuos, rótulo en Label (11px, mayúsculas, tinta gris) y cifra en 17px/800 tabular, recortada con elipsis.

### Línea de Etiqueta Para/De
«Para:» o «De:» impreso en Kalam 400 gris, seguido del nombre en Kalam 700 sobre una línea de escritura de 2px tinta noche. El nombre aún secreto se escribe en cobalto con tracking 0.08em.

### Placa de Precio
Kalam 700 22px tabular sobre dorado, radio 8px, inclinada 2°. Sin precio: placa neutra en Archivo 13px/700, sin inclinación.

### Fila de Deseo
Etiqueta pequeña: recorte de 22px arriba a la derecha, ojal de 12px a la izquierda, radio 8px, título 18px/800, placa de precio a la derecha, metadatos (tienda, prioridad) en 15px tinta gris con iconos de 16px, y acción «Ver dónde comprarlo» como botón primario pequeño.

### PIN
Cuatro casillas de 56×64px con borde canto de cartulina (cobalto la activa), dígitos en Kalam 34px; la casilla llena sube 2px y muestra un punto de tinta. Teclado de 3 columnas con teclas de 60px en lavado de cartulina. Error: sacudida horizontal de 0.4s.

### Volteo de Revelación
La etiqueta colgante tiene dos caras en la misma celda de grilla; al revelar gira 180° en Y (900ms, ease-out expo, perspectiva 1200px) y la pita se balancea 1.6s amortiguado. Con movimiento reducido no hay giro ni balanceo: cambia de cara al instante.

## Do's and Don'ts

### Do:
- **Do** poner todo el trabajo dentro de etiquetas o paneles de cartulina sobre el papel cobalto.
- **Do** usar un solo botón fucsia intenso (#d81468) por vista, de ancho completo, para el siguiente paso.
- **Do** escribir nombres de personas y precios en Kalam 700, y todo lo demás en Archivo.
- **Do** usar Archivo condensado (ancho 72–85%, 800) para títulos.
- **Do** mostrar cifras tabulares en presupuesto, código, precio, PIN y contadores.
- **Do** mantener objetivos táctiles de 44px o más (botones de 52px, campos de 50px).
- **Do** acompañar todo estado de color con texto o icono.
- **Do** usar foco dorado de 3px sobre el papel y fucsia intenso dentro de superficies blancas.
- **Do** respetar prefers-reduced-motion: el volteo y el balanceo se vuelven un cambio instantáneo.

### Don't:
- **Don't** usar fondos blancos a pantalla completa ni la combinación navideña rojo/verde.
- **Don't** usar copos de nieve, emojis de regalo ni clip art navideño; la Navidad está en el papel, la cinta y la etiqueta.
- **Don't** poner texto blanco sobre el fucsia brillante (#ff3d8b); ese tono es solo pita y decoración.
- **Don't** usar el dorado lleno como fondo de botones o bloques grandes.
- **Don't** usar Kalam en botones, títulos o párrafos.
- **Don't** apoyar una superficie blanca sobre el papel sin sombra.
- **Don't** añadir rótulos en mayúsculas sobre los títulos de sección; las mayúsculas espaciadas existen solo en los rótulos de la franja segmentada.
