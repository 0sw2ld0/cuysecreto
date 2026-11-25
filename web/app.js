// CuySecreto · app de una sola página, sin dependencias.
const CFG = window.CUY_CONFIG || {};
const $main = document.getElementById("main");
const $barRight = document.getElementById("bar-right");
const $toast = document.getElementById("toast");

/* ───────────────────────── API ───────────────────────── */
async function rpc(fn, args = {}) {
  const headers = { "Content-Type": "application/json" };
  if (CFG.anonKey) {
    headers.apikey = CFG.anonKey;
    // Las claves "anon" antiguas son JWT y van también como Bearer; las nuevas sb_publishable_ solo en apikey.
    if (CFG.anonKey.startsWith("eyJ")) headers.Authorization = `Bearer ${CFG.anonKey}`;
  }
  let res;
  try {
    res = await fetch(`${CFG.apiUrl.replace(/\/$/, "")}/rpc/${fn}`, { method: "POST", headers, body: JSON.stringify(args) });
  } catch {
    throw Object.assign(new Error("Sin conexión. Revisa tu internet e inténtalo otra vez."), { hint: "network" });
  }
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) {
    const msg = data && data.code === "P0001" ? data.message : "Algo salió mal en el servidor. Inténtalo otra vez.";
    throw Object.assign(new Error(msg), { hint: data && data.hint });
  }
  return data;
}

/* ───────────────────────── Almacenamiento local ───────────────────────── */
const STORE_KEY = "cuysecreto:v1";
function loadStore() {
  try { return JSON.parse(localStorage.getItem(STORE_KEY)) || { sessions: {}, admins: {} }; }
  catch { return { sessions: {}, admins: {} }; }
}
function saveStore(s) { try { localStorage.setItem(STORE_KEY, JSON.stringify(s)); } catch { /* modo privado */ } }
function setSession(code, data) { const s = loadStore(); s.sessions[code] = { ...data, at: Date.now() }; saveStore(s); }
function getSession(code) { return loadStore().sessions[code]; }
function dropSession(code) { const s = loadStore(); delete s.sessions[code]; saveStore(s); }
function setAdmin(code, data) { const s = loadStore(); s.admins[code] = { ...data, at: Date.now() }; saveStore(s); }

/* ───────────────────────── Utilidades ───────────────────────── */
const esc = (v) => String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const icon = (name, cls = "i") => `<svg class="${cls}" aria-hidden="true"><use href="#i-${name}"/></svg>`;
const normCode = (c) => String(c || "").toUpperCase().replace(/[^A-Z0-9]/g, "").replace(/^CUY/, "").slice(0, 5);
const fullCode = (c) => `CUY-${normCode(c)}`;

function money(amount, currency = "PEN") {
  if (amount === null || amount === undefined || amount === "") return "";
  const n = Number(amount);
  const frac = Number.isInteger(n) ? 0 : 2;
  try {
    return new Intl.NumberFormat("es-PE", { style: "currency", currency, minimumFractionDigits: frac, maximumFractionDigits: frac }).format(n);
  } catch { return `${currency} ${n.toFixed(frac)}`; }
}
const CURRENCY_SYMBOL = { PEN: "S/", USD: "US$", EUR: "€", MXN: "MX$", COP: "COL$", CLP: "CLP$", ARS: "AR$", BOB: "Bs" };

function shortDate(iso) {
  if (!iso) return "Por definir";
  const [y, m, d] = iso.split("-").map(Number);
  return new Intl.DateTimeFormat("es-PE", { day: "numeric", month: "short" }).format(new Date(y, m - 1, d)).replace(".", "");
}
function longDate(iso) {
  if (!iso) return "";
  const [y, m, d] = iso.split("-").map(Number);
  return new Intl.DateTimeFormat("es-PE", { weekday: "long", day: "numeric", month: "long" }).format(new Date(y, m - 1, d));
}

let toastTimer;
function toast(msg) {
  $toast.textContent = msg;
  $toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => $toast.classList.remove("show"), 2800);
}

async function copy(text, okMsg = "Copiado") {
  try { await navigator.clipboard.writeText(text); toast(okMsg); }
  catch {
    const ta = document.createElement("textarea"); ta.value = text; document.body.append(ta); ta.select();
    try { document.execCommand("copy"); toast(okMsg); } catch { toast("No se pudo copiar"); }
    ta.remove();
  }
}

const baseUrl = () => location.origin + location.pathname;
const joinUrl = (code) => `${baseUrl()}#/g/${code}`;
const adminUrl = (code, token) => `${baseUrl()}#/admin/${code}/${token}`;

function busy(btn, on, label) {
  if (!btn) return;
  if (on) { btn.dataset.label = btn.innerHTML; btn.disabled = true; btn.innerHTML = `<span class="spin" aria-hidden="true"></span>${label || "Un momento…"}`; }
  else { btn.disabled = false; if (btn.dataset.label) btn.innerHTML = btn.dataset.label; }
}

function render(html, { bar = "", repaint = false } = {}) {
  $main.innerHTML = `<div class="${repaint ? "" : "view"}">${html}</div>`;
  $barRight.innerHTML = bar;
  if (!repaint) { window.scrollTo(0, 0); $main.focus({ preventScroll: true }); }
}
function loading(msg = "Cargando…") {
  render(`<div class="loading" role="status"><div class="spin"></div><span>${esc(msg)}</span></div>`);
}
function errorView(msg, backHref = "#/") {
  render(`
    <a class="back" href="${backHref}">${icon("back")} Volver</a>
    <div class="hang"><div class="tag">
      <h3>Ups</h3>
      <p class="hint">${esc(msg)}</p>
      <div class="stack">
        <button class="btn btn-primary block" data-act="retry">Intentar otra vez</button>
        <a class="btn btn-ghost block" href="#/">Ir al inicio</a>
      </div>
    </div></div>`);
  $main.querySelector('[data-act="retry"]').onclick = () => route();
}

function eventSeg(ev) {
  return `<div class="seg" role="list">
    <div role="listitem"><small>Presupuesto</small><b>${ev.budget != null ? esc(money(ev.budget, ev.currency)) : "Libre"}</b></div>
    <div role="listitem"><small>Intercambio</small><b>${esc(shortDate(ev.exchange_date))}</b></div>
    <div role="listitem"><small>Grupo</small><b>${ev.group_size ?? ev.count ?? ""}</b></div>
  </div>${ev.note ? `<p class="event-note">${esc(ev.note)}</p>` : ""}`;
}

/* ───────────────────────── Router ───────────────────────── */
let cleanup = null;
function route() {
  if (cleanup) { cleanup(); cleanup = null; }
  const parts = location.hash.replace(/^#\/?/, "").split("/").filter(Boolean).map(decodeURIComponent);
  const [a, b, c] = parts;
  if (!a) return viewHome();
  if (a === "crear") return viewCreate();
  if (a === "g" && b) return viewJoin(fullCode(b));
  if (a === "yo" && b) return viewMe(fullCode(b));
  if (a === "admin" && b) {
    const token = c || (loadStore().admins[fullCode(b)] || {}).token;
    if (!token) return errorView("Necesitas el enlace completo de organizador para entrar a este panel.");
    return viewAdmin(fullCode(b), token);
  }
  return viewHome();
}
window.addEventListener("hashchange", route);
const go = (hash) => { if (location.hash === hash) route(); else location.hash = hash; };

/* ───────────────────────── Inicio ───────────────────────── */
function viewHome() {
  const s = loadStore();
  const mine = [
    ...Object.entries(s.sessions).map(([code, v]) => ({ code, name: v.eventName, who: `Entras como ${v.name}`, href: `#/yo/${code}`, at: v.at })),
    ...Object.entries(s.admins).map(([code, v]) => ({ code, name: v.eventName, who: "Organizas tú", href: `#/admin/${code}/${v.token}`, at: v.at })),
  ].sort((x, y) => y.at - x.at);

  render(`
    <section class="hero">
      <h1>Amigo secreto, sin enredos.</h1>
      <p class="lead">Sorteo justo, listas de deseos con tienda y precio, y a quién te tocó siempre a la mano con tu código y PIN.</p>
    </section>

    <div class="hang"><form class="tag" id="enter" novalidate>
      <label class="lab" for="code">Código de tu grupo</label>
      <div class="field" style="margin-top:8px">
        <input id="code" class="code-input" name="code" autocomplete="off" autocapitalize="characters" spellcheck="false"
          placeholder="CUY-•••••" maxlength="9" aria-describedby="enter-err">
      </div>
      <p class="form-error" id="enter-err" role="alert"></p>
      <button class="btn btn-primary block" type="submit">Entrar a mi grupo</button>
    </form></div>

    <div class="home-actions">
      <a class="btn btn-ghost block" href="#/crear">${icon("plus")} Organizar un amigo secreto</a>
    </div>

    ${mine.length ? `<h2 class="sec">Mis grupos en este celular</h2>
      <div class="mine">${mine.map((m) => `<a href="${m.href}"><div><b>${esc(m.name || m.code)}</b><span>${esc(m.who)} · ${esc(m.code)}</span></div>${icon("back", "i flip-x")}</a>`).join("")}</div>` : ""}

    <h2 class="sec">Así se juega</h2>
    <ol class="how">
      <li><span class="dot">${icon("gift")}</span><div><b>El organizador crea el grupo</b><span>Pone el presupuesto, la fecha y los nombres, y comparte el código por WhatsApp.</span></div></li>
      <li><span class="dot">${icon("key")}</span><div><b>Cada uno entra con su nombre y un PIN</b><span>Con el código y tu PIN recuperas todo desde cualquier celular.</span></div></li>
      <li><span class="dot">${icon("store")}</span><div><b>Arma tu lista de deseos</b><span>Qué quieres, dónde conseguirlo y cuánto cuesta.</span></div></li>
      <li><span class="dot">${icon("lock")}</span><div><b>Sorteo y secreto</b><span>Cada quien ve solo a quién le tocó. Ni el organizador ve las parejas.</span></div></li>
    </ol>
    <p class="foot">Hecho con cariño por <a href="https://cuycoders.dev">CuyCoders</a></p>
  `);
  $main.querySelectorAll(".flip-x").forEach((el) => (el.style.transform = "scaleX(-1)"));

  const form = $main.querySelector("#enter");
  const input = form.code;
  input.addEventListener("input", () => {
    const n = normCode(input.value);
    input.value = n ? `CUY-${n}` : "";
  });
  form.onsubmit = async (e) => {
    e.preventDefault();
    const err = form.querySelector("#enter-err");
    const n = normCode(input.value);
    if (n.length !== 5) { err.textContent = "El código tiene 5 letras o números después de CUY-."; input.focus(); return; }
    go(`#/g/CUY-${n}`);
  };
}

/* ───────────────────────── Crear grupo ───────────────────────── */
function viewCreate() {
  const names = [];
  render(`
    <a class="back" href="#/">${icon("back")} Inicio</a>
    <h1>Nuevo amigo secreto</h1>
    <p class="lead">Llena lo básico. Podrás cambiarlo después desde tu panel.</p>
    <form class="hang" id="create" novalidate><div class="tag">
      <label class="field"><span>Nombre del grupo</span>
        <input name="name" required maxlength="80" placeholder="Navidad Familia León 2026" autocomplete="off"></label>
      <div class="grid-2">
        <label class="field"><span>Presupuesto <em>(máx.)</em></span>
          <div class="money"><b id="cur-sym">S/</b><input name="budget" inputmode="decimal" placeholder="80" autocomplete="off"></div></label>
        <label class="field"><span>Moneda</span>
          <select name="currency">${Object.entries(CURRENCY_SYMBOL).map(([k, v]) => `<option value="${k}">${v} · ${k}</option>`).join("")}</select></label>
      </div>
      <label class="field"><span>Fecha del intercambio <em>(opcional)</em></span><input type="date" name="date"></label>
      <fieldset class="field" style="border:0;padding:0;margin:0 0 14px"><span style="font-size:14px;font-weight:700;margin-bottom:6px;display:block">¿Cómo van a sortear?</span>
        <div class="prio-pick two">
          <label><input type="radio" name="mode" value="app" checked><span>La app sortea en secreto</span></label>
          <label><input type="radio" name="mode" value="manual"><span>Ya sorteamos a mano</span></label>
        </div>
        <span class="mode-hint" id="mode-hint">Nadie, ni tú, verá quién le tocó a quién.</span>
      </fieldset>
      <label class="field"><span>Nota para el grupo <em>(opcional)</em></span>
        <input name="note" maxlength="300" placeholder="En casa de la abuela, 8 p. m." autocomplete="off"></label>

      <div class="field"><span id="ppl-label">Participantes <em id="ppl-count">(mínimo 3)</em></span>
        <div class="chips" id="chips" aria-live="polite"></div>
        <div class="add-line">
          <input class="input" id="new-name" placeholder="Escribe un nombre" aria-labelledby="ppl-label" autocomplete="off" enterkeyhint="done">
          <button class="btn btn-light btn-sm" type="button" id="add-name" aria-label="Agregar participante">${icon("plus")}</button>
        </div>
      </div>
      <p class="hint" style="margin:-4px 0 16px;color:var(--ink-2);font-size:14px">Si tú también juegas, agrégate. Puedes pegar varios nombres separados por comas.</p>
      <p class="form-error" id="create-err" role="alert"></p>
      <button class="btn btn-primary block" type="submit">Crear grupo</button>
    </div></form>
  `);
  const form = $main.querySelector("#create");
  const chips = form.querySelector("#chips");
  const input = form.querySelector("#new-name");
  const err = form.querySelector("#create-err");
  form.currency.onchange = () => (form.querySelector("#cur-sym").textContent = CURRENCY_SYMBOL[form.currency.value]);
  form.querySelectorAll('input[name="mode"]').forEach((r) => (r.onchange = () => {
    form.querySelector("#mode-hint").textContent = form.mode.value === "manual"
      ? "La app solo guarda las listas de deseos, y cada uno ve las de todos."
      : "Nadie, ni tú, verá quién le tocó a quién.";
  }));

  const draw = () => {
    chips.innerHTML = names.map((n, i) => `<span class="chip">${esc(n)}<button type="button" data-i="${i}" aria-label="Quitar a ${esc(n)}">${icon("x")}</button></span>`).join("");
    form.querySelector("#ppl-count").textContent = names.length ? `(${names.length})` : "(mínimo 3)";
  };
  const add = () => {
    const parts = input.value.split(/[,\n;]+/).map((s) => s.trim().replace(/\s+/g, " ")).filter(Boolean);
    for (const p of parts) {
      if (names.some((n) => n.toLowerCase() === p.toLowerCase())) { toast(`${p} ya está en la lista`); continue; }
      names.push(p.slice(0, 40));
    }
    input.value = ""; draw(); input.focus();
  };
  input.addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); add(); } });
  input.addEventListener("paste", () => setTimeout(() => { if (/[,\n;]/.test(input.value)) add(); }));
  form.querySelector("#add-name").onclick = add;
  chips.onclick = (e) => { const b = e.target.closest("button[data-i]"); if (b) { names.splice(+b.dataset.i, 1); draw(); } };

  form.onsubmit = async (e) => {
    e.preventDefault();
    if (input.value.trim()) add();
    err.textContent = "";
    const name = form.name.value.trim();
    const budget = form.budget.value.trim().replace(",", ".");
    if (!name) { err.textContent = "Ponle un nombre al grupo."; form.name.focus(); return; }
    if (budget && !(Number(budget) >= 0)) { err.textContent = "El presupuesto debe ser un número."; form.budget.focus(); return; }
    if (names.length < 3) { err.textContent = "Agrega al menos 3 participantes para poder sortear."; input.focus(); return; }
    const btn = form.querySelector('button[type="submit"]');
    busy(btn, true, "Creando…");
    try {
      const r = await rpc("cs_create_event", {
        p_name: name, p_budget: budget ? Number(budget) : null, p_currency: form.currency.value,
        p_exchange_date: form.date.value || null, p_note: form.note.value.trim() || null, p_participants: names,
      });
      if (form.mode.value === "manual") await rpc("cs_admin_set_draw_mode", { p_code: r.code, p_token: r.admin_token, p_mode: "manual" });
      setAdmin(r.code, { token: r.admin_token, eventName: name });
      toast("¡Grupo creado!");
      go(`#/admin/${r.code}/${r.admin_token}`);
    } catch (ex) { err.textContent = ex.message; busy(btn, false); }
  };
}

/* ───────────────────────── Panel del organizador ───────────────────────── */
async function viewAdmin(code, token) {
  loading("Abriendo tu panel…");
  let data;
  try { data = await rpc("cs_admin_get", { p_code: code, p_token: token }); }
  catch (ex) { return errorView(ex.message); }
  setAdmin(code, { token, eventName: data.event.name });
  let confirmDraw = false;
  let painted = false;
  let confirmReset = null;

  const call = async (fn, args, btn, okMsg) => {
    busy(btn, true);
    try { data = await rpc(fn, { p_code: code, p_token: token, ...args }); if (okMsg) toast(okMsg); paint(); }
    catch (ex) { toast(ex.message); busy(btn, false); }
  };

  const paint = () => {
    const ev = data.event;
    const ppl = data.participants;
    const byId = Object.fromEntries(ppl.map((p) => [p.id, p]));
    const joined = ppl.filter((p) => p.joined).length;
    const withList = ppl.filter((p) => p.wishes > 0).length;
    const revealed = ppl.filter((p) => p.revealed).length;
    const msg = `¡Hola! Te invito al amigo secreto «${ev.name}».${ev.budget != null ? ` Presupuesto: ${money(ev.budget, ev.currency)}.` : ""}${ev.exchange_date ? ` Intercambio: ${longDate(ev.exchange_date)}.` : ""}\n\nEntra aquí, elige tu nombre y crea tu PIN:\n${joinUrl(code)}\n\nCódigo del grupo: ${code}`;

    render(`
      <h1>${esc(ev.name)}</h1>
      <p class="progress"><span><b>${joined}</b> de ${ppl.length} entraron</span><span><b>${withList}</b> con lista</span>${ev.drawn ? `<span><b>${revealed}</b> vieron su resultado</span>` : ""}</p>
      ${eventSeg({ ...ev, count: ppl.length })}

      <div class="admin-warn" style="margin-top:16px" role="note">${icon("key")}<div><b>Guarda este enlace de organizador.</b> Es la única llave de este panel.
        <div style="margin-top:8px"><button class="btn btn-light btn-sm" data-act="copy-admin">${icon("copy")} Copiar mi enlace de organizador</button></div></div></div>

      <h2 class="sec">Invita a tu grupo</h2>
      <div class="hang"><div class="tag share">
        <span class="lab" style="text-align:center">Código del grupo</span>
        <div class="code-big">${esc(code)}</div>
        <a class="btn btn-primary block" target="_blank" rel="noopener" href="https://wa.me/?text=${encodeURIComponent(msg)}">${icon("wa")} Enviar por WhatsApp</a>
        <div class="row-btns">
          <button class="btn btn-ghost btn-sm" data-act="copy-join">${icon("copy")} Copiar enlace</button>
          ${navigator.share ? `<button class="btn btn-ghost btn-sm" data-act="share">${icon("share")} Compartir</button>` : ""}
        </div>
      </div></div>

      <h2 class="sec">Participantes <small>${ppl.length}</small></h2>
      <div class="panel">
        <ul class="people">${ppl.map((p) => `
          <li>
            <div class="who"><b class="hand">${esc(p.name)}</b>
              <div class="status">
                <span class="st ${p.joined ? "on" : ""}">${p.joined ? icon("check") + "Entró" : "No entra aún"}</span>
                <span class="st ${p.wishes ? "on" : ""}">${p.wishes ? `${p.wishes} ${p.wishes === 1 ? "deseo" : "deseos"}` : "Sin lista"}</span>
                ${ev.drawn ? `<span class="st ${p.revealed ? "on" : ""}">${p.revealed ? icon("check") + "Vio resultado" : "No lo ve aún"}</span>` : ""}
                ${p.locked ? `<span class="st warn">${icon("lock")}Bloqueado</span>` : ""}
              </div>
              ${confirmReset === p.id ? `<div class="confirm"><p>¿Reiniciar el PIN de ${esc(p.name)}? Podrá crear uno nuevo al entrar.</p>
                <div class="row-btns"><button class="btn btn-primary btn-sm" data-act="reset-yes" data-id="${p.id}">Sí, reiniciar</button><button class="btn btn-ghost btn-sm" data-act="reset-no">Cancelar</button></div></div>` : ""}
            </div>
            <div class="acts">
              ${p.has_pin ? `<button class="btn btn-ghost btn-sm" data-act="reset" data-id="${p.id}" aria-label="Nuevo PIN para ${esc(p.name)}">Nuevo PIN</button>` : ""}
              ${!ev.drawn ? `<button class="btn-icon" data-act="remove" data-id="${p.id}" aria-label="Quitar a ${esc(p.name)}" title="Quitar">${icon("trash")}</button>` : ""}
            </div>
          </li>`).join("")}
        </ul>
        ${!ev.drawn ? `<form class="add-line" id="add-p"><input class="input" name="n" maxlength="40" placeholder="Agregar a alguien" aria-label="Nombre del nuevo participante" autocomplete="off">
          <button class="btn btn-light btn-sm" aria-label="Agregar">${icon("plus")}</button></form>` : ""}
      </div>

      ${ev.draw_mode === "manual" ? "" : `<details class="more" ${data.exclusions.length ? "open" : ""}>
        <summary>Parejas que no deben tocarse${data.exclusions.length ? ` (${data.exclusions.length})` : ""}</summary>
        <div class="panel">
          <p class="note">Útil para parejas o hermanos que ya se regalan entre sí. Funciona en ambos sentidos.</p>
          ${data.exclusions.length ? `<ul class="excl">${data.exclusions.map((x) => `<li><span>${esc(byId[x.a]?.name)} ↔ ${esc(byId[x.b]?.name)}</span>
            ${!ev.drawn ? `<button class="btn-icon" data-act="excl" data-a="${x.a}" data-b="${x.b}" aria-label="Quitar exclusión">${icon("trash")}</button>` : ""}</li>`).join("")}</ul>` : ""}
          ${!ev.drawn && ppl.length >= 2 ? `<form class="excl-form" id="excl-form">
            <select name="a" aria-label="Primera persona">${ppl.map((p) => `<option value="${p.id}">${esc(p.name)}</option>`).join("")}</select>
            <select name="b" aria-label="Segunda persona">${ppl.map((p, i) => `<option value="${p.id}" ${i === 1 ? "selected" : ""}>${esc(p.name)}</option>`).join("")}</select>
            <button class="btn btn-light btn-sm" aria-label="Agregar exclusión">${icon("plus")}</button></form>` : ""}
        </div>
      </details>`}

      <section class="draw-box">
        ${ev.draw_mode === "manual" ? `
          <div class="hang"><div class="tag">
            <p class="hand" style="font-size:34px;margin:0 0 8px">Sorteo hecho a mano</p>
            <p class="hint">La app no sortea en este grupo. Cada persona entra con su PIN, arma su lista y ve las listas de todos.</p>
            <button class="btn btn-ghost block" data-act="mode-app">Mejor que sortee la app</button>
          </div></div>` : ev.drawn ? `
          <div class="hang"><div class="tag">
            <p class="hand" style="font-size:34px;margin:0 0 8px">¡Sorteo hecho!</p>
            <p class="hint">Cada persona ya puede entrar y ver a quién le tocó. Tú tampoco puedes ver las parejas.</p>
            ${revealed === 0 ? `<button class="btn btn-ghost block" data-act="undo">Deshacer sorteo</button>` : `<p class="hint" style="margin:0">Ya no se puede deshacer: alguien vio su resultado.</p>`}
          </div></div>` : `
          ${confirmDraw ? `<div class="confirm"><p>Se sortearán ${ppl.length} personas${data.exclusions.length ? ` respetando ${data.exclusions.length} ${data.exclusions.length === 1 ? "exclusión" : "exclusiones"}` : ""}. Nadie, ni tú, verá las parejas.</p>
            <div class="row-btns"><button class="btn btn-primary" data-act="draw-yes">Sortear ahora</button><button class="btn btn-ghost" data-act="draw-no">Todavía no</button></div></div>`
          : `<button class="btn btn-primary block" data-act="draw" ${ppl.length < 3 ? "disabled" : ""}>${icon("gift")} Hacer el sorteo</button>
             <p class="event-note" style="text-align:center">${ppl.length < 3 ? "Necesitas al menos 3 personas." : "Puedes sortear aunque no todos hayan entrado todavía."}</p>
             <button class="btn btn-ghost block" style="margin-top:14px" data-act="mode-manual">¿Ya sortearon a mano? Usar solo las listas</button>`}`}
      </section>

      <details class="more">
        <summary>Editar datos del grupo</summary>
        <form class="tag compact" id="edit" novalidate>
          <label class="field"><span>Nombre del grupo</span><input name="name" maxlength="80" value="${esc(ev.name)}"></label>
          <div class="grid-2">
            <label class="field"><span>Presupuesto</span><div class="money"><b>${esc(CURRENCY_SYMBOL[ev.currency] || ev.currency)}</b><input name="budget" inputmode="decimal" value="${ev.budget ?? ""}"></div></label>
            <label class="field"><span>Moneda</span><select name="currency">${Object.entries(CURRENCY_SYMBOL).map(([k, v]) => `<option value="${k}" ${k === ev.currency ? "selected" : ""}>${v} · ${k}</option>`).join("")}</select></label>
          </div>
          <label class="field"><span>Fecha del intercambio</span><input type="date" name="date" value="${esc(ev.exchange_date || "")}"></label>
          <label class="field"><span>Nota</span><input name="note" maxlength="300" value="${esc(ev.note || "")}"></label>
          <button class="btn btn-primary block">Guardar cambios</button>
        </form>
      </details>

      <h2 class="sec">¿Tú también juegas?</h2>
      <a class="btn btn-light block" href="#/g/${code}">Entrar como participante</a>
    `, { bar: `<span class="pill">Organizador</span>`, repaint: painted });
    painted = true;

    $main.onclick = async (e) => {
      const b = e.target.closest("[data-act]");
      if (!b) return;
      const act = b.dataset.act;
      if (act === "copy-admin") copy(adminUrl(code, token), "Enlace de organizador copiado");
      if (act === "copy-join") copy(joinUrl(code), "Enlace del grupo copiado");
      if (act === "share") navigator.share({ title: ev.name, text: msg }).catch(() => {});
      if (act === "remove") call("cs_admin_remove_participant", { p_participant: b.dataset.id }, b, "Quitado del grupo");
      if (act === "reset") { confirmReset = b.dataset.id; paint(); }
      if (act === "reset-no") { confirmReset = null; paint(); }
      if (act === "reset-yes") { confirmReset = null; call("cs_admin_reset_pin", { p_participant: b.dataset.id }, b, "PIN reiniciado"); }
      if (act === "excl") call("cs_admin_toggle_exclusion", { p_a: b.dataset.a, p_b: b.dataset.b }, b);
      if (act === "draw") { confirmDraw = true; paint(); $main.querySelector('[data-act="draw-yes"]').focus(); }
      if (act === "draw-no") { confirmDraw = false; paint(); }
      if (act === "draw-yes") { confirmDraw = false; call("cs_admin_draw", {}, b, "¡Sorteo hecho!"); }
      if (act === "undo") call("cs_admin_undo_draw", {}, b, "Sorteo deshecho");
      if (act === "mode-manual") call("cs_admin_set_draw_mode", { p_mode: "manual" }, b, "Listo: cada uno verá las listas de todos");
      if (act === "mode-app") call("cs_admin_set_draw_mode", { p_mode: "app" }, b, "Ahora la app hará el sorteo");
    };
    const addP = $main.querySelector("#add-p");
    if (addP) addP.onsubmit = (e) => { e.preventDefault(); const n = addP.n.value.trim(); if (n) call("cs_admin_add_participant", { p_name: n }, addP.querySelector("button"), `${n} agregado`); };
    const exf = $main.querySelector("#excl-form");
    if (exf) exf.onsubmit = (e) => {
      e.preventDefault();
      if (exf.a.value === exf.b.value) return toast("Elige dos personas distintas");
      const exists = data.exclusions.some((x) => [x.a, x.b].includes(exf.a.value) && [x.a, x.b].includes(exf.b.value));
      if (exists) return toast("Esa pareja ya está excluida");
      call("cs_admin_toggle_exclusion", { p_a: exf.a.value, p_b: exf.b.value }, exf.querySelector("button"), "Exclusión agregada");
    };
    const ed = $main.querySelector("#edit");
    ed.onsubmit = (e) => {
      e.preventDefault();
      const budget = ed.budget.value.trim().replace(",", ".");
      if (budget && !(Number(budget) >= 0)) return toast("El presupuesto debe ser un número");
      call("cs_admin_update_event", {
        p_name: ed.name.value, p_budget: budget ? Number(budget) : null, p_currency: ed.currency.value,
        p_exchange_date: ed.date.value || null, p_note: ed.note.value || null,
      }, ed.querySelector("button"), "Cambios guardados");
    };
  };
  paint();
  cleanup = () => { $main.onclick = null; };
}

/* ───────────────────────── Entrar: nombre + PIN ───────────────────────── */
async function viewJoin(code) {
  loading("Buscando tu grupo…");
  let data;
  try { data = await rpc("cs_event_public", { p_code: code }); }
  catch (ex) { return errorView(ex.hint === "event_not_found" ? `No encontramos el grupo ${code}. Revisa el código con quien te lo envió.` : ex.message); }
  const ev = data.event;
  const existing = getSession(code);

  const pickName = () => {
    render(`
      <a class="back" href="#/">${icon("back")} Inicio</a>
      <h1>${esc(ev.name)}</h1>
      ${eventSeg({ ...ev, count: data.participants.length })}
      ${existing ? `<div style="margin-top:18px"><a class="btn btn-light block" href="#/yo/${code}">Seguir como ${esc(existing.name)}</a></div>` : ""}
      <h2 class="sec">¿Quién eres?</h2>
      <div class="names">${data.participants.map((p) => `<button class="name-btn" data-id="${p.id}"><span>${esc(p.name)}</span>${p.has_pin ? icon("lock") : ""}</button>`).join("")}</div>
      <p class="event-note">${icon("lock", "i")} <span style="vertical-align:4px">= ya tiene PIN. ¿No ves tu nombre? Pídele al organizador que te agregue.</span></p>
    `, { bar: `<span class="pill">${esc(code)}</span>` });
    $main.querySelector(".names").onclick = (e) => {
      const b = e.target.closest(".name-btn");
      if (b) pinStep(data.participants.find((p) => p.id === b.dataset.id));
    };
  };

  const pinStep = (person) => {
    const creating = !person.has_pin;
    let first = null;
    let pin = "";
    let sending = false;
    render(`
      <button class="back" data-act="back">${icon("back")} No soy ${esc(person.name)}</button>
      <div class="hang"><div class="tag">
        <p class="tag-line big"><span class="printed">Para:</span> <span class="hand">${esc(person.name)}</span></p>
        <h3 id="pin-title">${creating ? "Crea tu PIN" : "Escribe tu PIN"}</h3>
        <p class="hint" id="pin-hint">${creating ? "4 números que solo tú sepas. Con tu código y este PIN recuperas todo desde cualquier celular." : "El PIN de 4 números que creaste la primera vez."}</p>
        <div class="pin-boxes" id="boxes" aria-hidden="true"><span></span><span></span><span></span><span></span></div>
        <p class="visually-hidden" aria-live="polite" id="pin-live"></p>
        <p class="form-error" id="pin-err" role="alert"></p>
        <div class="pad" role="group" aria-label="Teclado del PIN">
          ${[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => `<button type="button" data-k="${n}">${n}</button>`).join("")}
          <button type="button" class="ghost" disabled aria-hidden="true" tabindex="-1"></button>
          <button type="button" data-k="0">0</button>
          <button type="button" data-k="del" aria-label="Borrar">${icon("back")}</button>
        </div>
        ${!creating ? `<p class="hint" style="margin:16px 0 0;font-size:14px">¿Olvidaste tu PIN? Pídele al organizador que lo reinicie desde su panel.</p>` : ""}
      </div></div>
    `, { bar: `<span class="pill">${esc(code)}</span>` });
    const boxes = $main.querySelector("#boxes");
    const err = $main.querySelector("#pin-err");
    const live = $main.querySelector("#pin-live");
    const paintBoxes = () => {
      [...boxes.children].forEach((b, i) => {
        b.textContent = "";
        b.classList.toggle("filled", i < pin.length);
        b.classList.toggle("on", i === pin.length);
      });
      live.textContent = `${pin.length} de 4 números`;
    };
    const fail = (msg) => {
      err.textContent = msg; pin = ""; paintBoxes();
      boxes.classList.remove("shake"); void boxes.offsetWidth; boxes.classList.add("shake");
    };
    const submit = async () => {
      if (creating && first === null) {
        first = pin; pin = ""; paintBoxes();
        $main.querySelector("#pin-title").textContent = "Repite tu PIN";
        $main.querySelector("#pin-hint").textContent = "Para asegurarnos de que lo escribiste bien.";
        err.textContent = "";
        return;
      }
      if (creating && pin !== first) {
        first = null;
        $main.querySelector("#pin-title").textContent = "Crea tu PIN";
        return fail("Los PIN no coinciden. Empecemos otra vez.");
      }
      sending = true;
      try {
        const r = await rpc("cs_join", { p_code: code, p_participant: person.id, p_pin: pin });
        if (!r.ok) { sending = false; return fail(r.error); }
        setSession(code, { token: r.token, name: r.name, eventName: ev.name });
        toast(creating ? "¡Listo! Guarda bien tu PIN" : `Hola de nuevo, ${r.name}`);
        go(`#/yo/${code}`);
      } catch (ex) { sending = false; fail(ex.message); }
    };
    const press = (k) => {
      if (sending) return;
      if (k === "del") { pin = pin.slice(0, -1); paintBoxes(); return; }
      if (pin.length >= 4) return;
      pin += k; err.textContent = ""; paintBoxes();
      if (pin.length === 4) setTimeout(submit, 120);
    };
    $main.querySelector(".pad").onclick = (e) => { const b = e.target.closest("[data-k]"); if (b) press(b.dataset.k); };
    $main.querySelector('[data-act="back"]').onclick = pickName;
    const onKey = (e) => {
      if (/^[0-9]$/.test(e.key)) press(e.key);
      else if (e.key === "Backspace") press("del");
    };
    document.addEventListener("keydown", onKey);
    cleanup = () => document.removeEventListener("keydown", onKey);
    paintBoxes();
  };

  pickName();
}

/* ───────────────────────── Mi página de participante ───────────────────────── */
async function viewMe(code) {
  const sess = getSession(code);
  if (!sess) return go(`#/g/${code}`);
  loading("Abriendo tu etiqueta…");
  let data;
  try { data = await rpc("cs_me", { p_token: sess.token }); }
  catch (ex) {
    if (ex.hint === "session_invalid") { dropSession(code); toast("Vuelve a entrar con tu PIN"); return go(`#/g/${code}`); }
    return errorView(ex.message);
  }
  setSession(code, { ...sess, eventName: data.event.name });

  const isManual = () => data.event.draw_mode === "manual";
  const GIFT_KEY = `cuysecreto:giftTo:${code}`;
  let giftTo = null; // a quién le regalo (sorteo a mano): solo se guarda en este celular
  try { giftTo = localStorage.getItem(GIFT_KEY); } catch { /* modo privado */ }
  let group = [];
  const loadGroup = async () => { group = isManual() ? await rpc("cs_group_wishes", { p_token: sess.token }) : []; };
  try { await loadGroup(); } catch { group = []; }
  if (giftTo && !group.some((g) => g.id === giftTo)) giftTo = null;
  let viewing = giftTo;
  let tab = isManual() ? "group" : data.revealed ? "them" : "mine";
  let editing = null; // null | "new" | wish id
  let justRevealed = false;
  let painted = false;

  const wishRow = (w, ev, mineList) => {
    const over = ev.budget != null && w.price != null && Number(w.price) > Number(ev.budget);
    return `<article class="wish">
      <div class="wish-title">${esc(w.title)}</div>
      ${w.price != null ? `<div class="price" aria-label="Precio aproximado ${esc(money(w.price, ev.currency))}">${esc(money(w.price, ev.currency))}</div>` : `<div class="price none">Sin precio</div>`}
      ${w.note ? `<p class="wish-note">${esc(w.note)}</p>` : ""}
      <div class="wish-meta">
        ${w.priority === 1 ? `<span class="prio p1">Lo que más quiero</span>` : w.priority === 3 ? `<span class="prio" style="background:#eef0f8;color:var(--ink-2)">Si se puede</span>` : ""}
        ${w.store ? `<span>${icon("store")}${esc(w.store)}</span>` : ""}
        ${over ? `<span class="over">Pasa el presupuesto</span>` : ""}
      </div>
      ${mineList ? `<div class="wish-actions">
          ${w.url ? `<a class="btn btn-ghost btn-sm" href="${esc(w.url)}" target="_blank" rel="noopener nofollow">${icon("link")} Ver enlace</a>` : ""}
          <button class="btn btn-ghost btn-sm" data-act="edit" data-id="${w.id}">${icon("edit")} Editar</button>
          <button class="btn-icon" data-act="del" data-id="${w.id}" aria-label="Borrar ${esc(w.title)}">${icon("trash")}</button>
        </div>`
        : w.url ? `<div class="wish-actions"><a class="btn btn-primary btn-sm" href="${esc(w.url)}" target="_blank" rel="noopener nofollow">${icon("link")} Ver dónde comprarlo</a></div>` : ""}
    </article>`;
  };

  const wishForm = (w = {}) => `
    <form class="tag compact" id="wish-form" novalidate>
      <h3>${w.id ? "Editar deseo" : "Nuevo deseo"}</h3>
      <label class="field"><span>¿Qué te gustaría recibir?</span><input name="title" maxlength="120" required value="${esc(w.title || "")}" placeholder="Audífonos inalámbricos" autocomplete="off"></label>
      <label class="field"><span>Detalles <em>(talla, color, modelo)</em></span><input name="note" maxlength="300" value="${esc(w.note || "")}" placeholder="Negros, que no sean de vincha" autocomplete="off"></label>
      <label class="field"><span>¿Dónde se consigue?</span><input name="store" maxlength="120" value="${esc(w.store || "")}" placeholder="Falabella, Gamarra, Mercado Libre…" autocomplete="off"></label>
      <div class="grid-2">
        <label class="field"><span>Precio aprox.</span><div class="money"><b>${esc(CURRENCY_SYMBOL[data.event.currency] || "")}</b><input name="price" inputmode="decimal" value="${w.price ?? ""}" placeholder="79" autocomplete="off"></div></label>
        <label class="field"><span>Enlace <em>(opcional)</em></span><input name="url" type="url" inputmode="url" maxlength="600" value="${esc(w.url || "")}" placeholder="https://…" autocomplete="off"></label>
      </div>
      <fieldset class="field" style="border:0;padding:0;margin:0 0 16px"><span style="font-size:14px;font-weight:700;margin-bottom:6px;display:block">¿Cuánto lo quieres?</span>
        <div class="prio-pick">
          ${[[1, "Lo que más quiero"], [2, "Me gustaría"], [3, "Si se puede"]].map(([v, l]) => `<label><input type="radio" name="priority" value="${v}" ${(w.priority || 2) === v ? "checked" : ""}><span>${l}</span></label>`).join("")}
        </div></fieldset>
      <p class="form-error" id="wish-err" role="alert"></p>
      <div class="row-btns"><button class="btn btn-primary" type="submit">Guardar</button><button class="btn btn-ghost" type="button" data-act="cancel">Cancelar</button></div>
    </form>`;

  const paint = () => {
    const ev = data.event;
    const me = data.me;
    const r = data.receiver;
    const wishes = me.wishes;
    const flipped = data.revealed;
    const manual = isManual();
    const gift = group.find((g) => g.id === giftTo);
    let next = "";
    if (manual) {
      next = wishes.length === 0
        ? `<button class="btn btn-primary block" data-act="new">${icon("plus")} Arma tu lista de deseos</button>`
        : !gift ? `<button class="btn btn-primary block" data-act="choose">${icon("gift")} Elige a quién le regalas</button>`
        : gift.wishes.length ? `<button class="btn btn-primary block" data-act="see-list">${icon("store")} Ver qué quiere ${esc(gift.name)}</button>` : "";
    } else if (!ev.drawn) {
      next = wishes.length === 0
        ? `<button class="btn btn-primary block" data-act="new">${icon("plus")} Armar mi lista de deseos</button>
           <div class="wait-note">${icon("gift")}<span>El organizador todavía no sortea. Mientras, arma tu lista para que tu amigo secreto sepa qué regalarte.</span></div>`
        : `<button class="btn btn-light block" data-act="refresh">Ver si ya sortearon</button>
           <div class="wait-note">${icon("check")}<span>Tu lista está lista. Cuando el organizador haga el sorteo, vuelve aquí para ver a quién te tocó.</span></div>`;
    } else if (!flipped) {
      next = `<button class="btn btn-primary block" data-act="reveal">${icon("gift")} Ver a quién me tocó</button>`;
    } else if (wishes.length === 0) {
      next = `<button class="btn btn-primary block" data-act="new">${icon("plus")} Arma tu lista de deseos</button>`;
    } else if (r && r.wishes.length) {
      next = `<button class="btn btn-primary block" data-act="see-list">${icon("store")} Ver qué quiere ${esc(r.name)}</button>`;
    }

    const theirList = r ? (r.wishes.length
      ? `<div class="wishes">${r.wishes.map((w) => wishRow(w, ev, false)).join("")}</div>`
      : `<div class="empty"><b>${esc(r.name)} todavía no arma su lista</b>Vuelve en unos días; aquí aparecerán sus deseos con tienda y precio.</div>`) : "";

    const sel = group.find((g) => g.id === viewing) || gift || group[0];
    const groupList = group.length ? `
      <div class="people-pick" role="group" aria-label="Elige de quién ver la lista">
        ${group.map((g) => `<button class="pick ${sel && g.id === sel.id ? "on" : ""}" data-view="${g.id}" aria-pressed="${sel && g.id === sel.id}">${g.id === giftTo ? icon("gift") : ""}<span>${esc(g.name)}</span><small>${g.wishes.length}</small></button>`).join("")}
      </div>
      ${sel ? `<div class="pick-head"><h3 class="hand">${esc(sel.name)}</h3>
          <button class="btn btn-sm ${sel.id === giftTo ? "btn-ghost" : "btn-light"}" data-act="gift-to" data-id="${sel.id}">${sel.id === giftTo ? "Ya no le regalo" : `${icon("gift")} Le regalo yo`}</button></div>
        ${sel.wishes.length ? `<div class="wishes">${sel.wishes.map((w) => wishRow(w, ev, false)).join("")}</div>`
          : `<div class="empty"><b>${esc(sel.name)} todavía no arma su lista</b>Vuelve en unos días; aquí aparecerán sus deseos con tienda y precio.</div>`}` : ""}`
      : `<div class="empty"><b>Todavía no hay nadie más</b>Cuando el organizador agregue a los demás, aquí verás sus listas.</div>`;

    const myList = `
      ${editing === "new" ? wishForm() : ""}
      ${wishes.length ? `<div class="wishes">${wishes.map((w) => (editing === w.id ? wishForm(w) : wishRow(w, ev, true))).join("")}</div>`
        : editing ? "" : `<div class="empty"><b>Tu lista está vacía</b>Agrega lo que te gustaría recibir, dónde se consigue y cuánto cuesta.</div>`}
      ${editing ? "" : `<button class="btn btn-ghost block" style="margin-top:12px" data-act="new" ${wishes.length >= 20 ? "disabled" : ""}>${icon("plus")} Agregar un deseo</button>`}`;

    render(`
      <h1>${esc(ev.name)}</h1>
      ${eventSeg({ ...ev, group_size: data.group_size })}

      ${manual ? `
      <div class="hang" style="margin-top:8px"><div class="tag">
        <p class="tag-line"><span class="printed">De:</span> <span class="hand">${esc(me.name)}</span></p>
        <p class="tag-line big"><span class="printed">Para:</span> ${gift ? `<span class="hand">${esc(gift.name)}</span>` : `<span class="hand q" aria-label="Sin elegir">¿ ? ? ?</span>`}</p>
        ${gift && (ev.budget != null || ev.exchange_date) ? `<p class="hint" style="margin:0 0 14px;color:var(--ink);font-size:16px">Regálale algo${ev.budget != null ? ` de hasta <b>${esc(money(ev.budget, ev.currency))}</b>` : ""}${ev.exchange_date ? ` para el <b>${esc(longDate(ev.exchange_date))}</b>` : ""}.</p>` : ""}
        <div class="tag-foot">${icon("lock")}<span>${gift ? "Solo se guarda en este celular; nadie más lo ve." : "Sortearon a mano: elige abajo a quién le regalas."}</span></div>
      </div></div>` : `
      <div class="hang reveal-wrap ${justRevealed ? "swing" : ""}" style="margin-top:8px">
        <div class="flip ${flipped ? "is-flipped" : ""}" id="flip">
          <div class="tag front-face" ${flipped ? 'aria-hidden="true"' : ""}>
            <p class="tag-line"><span class="printed">De:</span> <span class="hand">${esc(me.name)}</span></p>
            <p class="tag-line big"><span class="printed">Para:</span> <span class="hand q" aria-label="Todavía en secreto">¿ ? ? ?</span></p>
            <div class="tag-foot">${icon("lock")}<span>${ev.drawn ? "El sorteo ya se hizo." : "Esperando el sorteo."}</span></div>
          </div>
          <div class="tag back-face" ${flipped ? "" : 'aria-hidden="true"'}>
            <p class="tag-line"><span class="printed">De:</span> <span class="hand">${esc(me.name)}</span></p>
            <p class="tag-line big"><span class="printed">Para:</span> <span class="hand" id="receiver-name">${r ? esc(r.name) : ""}</span></p>
            ${ev.budget != null || ev.exchange_date ? `<p class="hint" style="margin:0 0 14px;color:var(--ink);font-size:16px">Regálale algo${ev.budget != null ? ` de hasta <b>${esc(money(ev.budget, ev.currency))}</b>` : ""}${ev.exchange_date ? ` para el <b>${esc(longDate(ev.exchange_date))}</b>` : ""}.</p>` : ""}
            <div class="tag-foot">${icon("lock")}<span>Es secreto: no se lo cuentes a nadie.</span></div>
          </div>
        </div>
      </div>`}
      <div class="next-step stack">${next}</div>

      ${manual ? `
        <div class="tabs" role="tablist" aria-label="Listas de deseos">
          <button role="tab" id="t-group" aria-controls="p-list" aria-selected="${tab === "group"}" data-tab="group">Listas del grupo</button>
          <button role="tab" id="t-mine" aria-controls="p-list" aria-selected="${tab === "mine"}" data-tab="mine">Mi lista</button>
        </div>
        <section id="p-list" role="tabpanel" aria-labelledby="${tab === "group" ? "t-group" : "t-mine"}">${tab === "group" ? groupList : myList}</section>`
      : flipped ? `
        <div class="tabs" role="tablist" aria-label="Listas de deseos">
          <button role="tab" id="t-them" aria-controls="p-list" aria-selected="${tab === "them"}" data-tab="them">Lista de ${esc(r.name)}</button>
          <button role="tab" id="t-mine" aria-controls="p-list" aria-selected="${tab === "mine"}" data-tab="mine">Mi lista</button>
        </div>
        <section id="p-list" role="tabpanel" aria-labelledby="${tab === "them" ? "t-them" : "t-mine"}">${tab === "them" ? theirList : myList}</section>`
      : `<h2 class="sec">Mi lista de deseos <small>${wishes.length ? `${wishes.length} ${wishes.length === 1 ? "deseo" : "deseos"}` : ""}</small></h2>${myList}`}

      <details class="more">
        <summary>Mi acceso</summary>
        <div class="panel"><p class="note">Entras como <b>${esc(me.name)}</b> en el grupo <b>${esc(code)}</b>. Desde otro celular, escribe este código, elige tu nombre y pon tu PIN.</p>
          <div style="padding:0 16px 16px" class="row-btns"><button class="btn btn-ghost btn-sm" data-act="copy-code">${icon("copy")} Copiar código</button><button class="btn btn-danger btn-sm" data-act="logout">Salir de este celular</button></div></div>
      </details>
    `, { bar: `<span class="pill">${esc(code)}</span>`, repaint: painted });
    painted = true;

    if (justRevealed) {
      const flip = $main.querySelector("#flip");
      flip.classList.add("anim");
      flip.classList.remove("is-flipped");
      requestAnimationFrame(() => requestAnimationFrame(() => flip.classList.add("is-flipped")));
      flip.addEventListener("transitionend", () => flip.classList.add("done"), { once: true });
      setTimeout(() => flip.classList.add("done"), 1200);
      justRevealed = false;
    } else if (flipped) $main.querySelector("#flip").classList.add("done");
    const form = $main.querySelector("#wish-form");
    if (form) { form.title.focus({ preventScroll: true }); form.scrollIntoView({ block: "center", behavior: "smooth" }); form.onsubmit = (e) => saveWish(e, form); }
  };

  const saveWish = async (e, form) => {
    e.preventDefault();
    const err = form.querySelector("#wish-err");
    const title = form.title.value.trim();
    const price = form.price.value.trim().replace(",", ".");
    if (!title) { err.textContent = "Escribe qué te gustaría recibir."; form.title.focus(); return; }
    if (price && !(Number(price) >= 0)) { err.textContent = "El precio debe ser un número."; form.price.focus(); return; }
    const btn = form.querySelector('button[type="submit"]');
    busy(btn, true, "Guardando…");
    try {
      data = await rpc("cs_wish_save", {
        p_token: sess.token, p_id: editing === "new" ? null : editing, p_title: title,
        p_note: form.note.value.trim() || null, p_store: form.store.value.trim() || null,
        p_url: form.url.value.trim() || null, p_price: price ? Number(price) : null,
        p_priority: Number(form.priority.value) || 2,
      });
      editing = null; toast("Deseo guardado"); paint();
    } catch (ex) { err.textContent = ex.message; busy(btn, false); }
  };

  $main.onclick = async (e) => {
    const v = e.target.closest("[data-view]");
    if (v) { viewing = v.dataset.view; paint(); $main.querySelector(`[data-view="${viewing}"]`).focus(); return; }
    const t = e.target.closest("[data-tab]");
    if (t) { tab = t.dataset.tab; editing = null; paint(); $main.querySelector(`[data-tab="${tab}"]`).focus(); return; }
    const b = e.target.closest("[data-act]");
    if (!b) return;
    const act = b.dataset.act;
    if (act === "new") { editing = "new"; tab = "mine"; paint(); }
    if (act === "edit") { editing = b.dataset.id; paint(); }
    if (act === "cancel") { editing = null; paint(); }
    if (act === "del") {
      busy(b, true, "");
      try { data = await rpc("cs_wish_delete", { p_token: sess.token, p_id: b.dataset.id }); toast("Deseo borrado"); paint(); }
      catch (ex) { toast(ex.message); busy(b, false); }
    }
    if (act === "refresh") {
      busy(b, true, "Revisando…");
      try { data = await rpc("cs_me", { p_token: sess.token }); await loadGroup(); toast(isManual() ? "Listas actualizadas" : data.event.drawn ? "¡Ya sortearon!" : "Todavía no sortean"); paint(); }
      catch (ex) { toast(ex.message); busy(b, false); }
    }
    if (act === "reveal") {
      busy(b, true, "Abriendo…");
      try { data = await rpc("cs_reveal", { p_token: sess.token }); justRevealed = true; tab = "them"; paint(); }
      catch (ex) { toast(ex.message); busy(b, false); }
    }
    if (act === "see-list" || act === "choose") {
      tab = isManual() ? "group" : "them";
      if (isManual() && giftTo) viewing = giftTo;
      paint(); $main.querySelector(".tabs").scrollIntoView({ behavior: "smooth", block: "start" });
    }
    if (act === "gift-to") {
      giftTo = giftTo === b.dataset.id ? null : b.dataset.id;
      try { giftTo ? localStorage.setItem(GIFT_KEY, giftTo) : localStorage.removeItem(GIFT_KEY); } catch { /* modo privado */ }
      toast(giftTo ? "Guardado en este celular" : "Listo, ya no está marcado");
      paint();
    }
    if (act === "copy-code") copy(code, "Código copiado");
    if (act === "logout") {
      try { await rpc("cs_logout", { p_token: sess.token }); } catch { /* igual salimos */ }
      dropSession(code); toast("Saliste de este celular"); go("#/");
    }
  };
  paint();
  cleanup = () => { $main.onclick = null; };
}

route();
