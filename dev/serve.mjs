// Servidor de desarrollo: sirve /web y reenvía /api/* a PostgREST local (imita Supabase).
// Uso: node dev/serve.mjs   →  http://localhost:5173
import http from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("../web/", import.meta.url));
const API = process.env.API || "http://localhost:54321";
const PORT = Number(process.env.PORT || 5173);
const TYPES = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8", ".svg": "image/svg+xml", ".webmanifest": "application/manifest+json", ".json": "application/json" };

http.createServer(async (req, res) => {
  if (req.url.startsWith("/api/")) {
    const chunks = [];
    for await (const c of req) chunks.push(c);
    const r = await fetch(API + req.url.slice(4), { method: req.method, headers: { "content-type": req.headers["content-type"] || "application/json" }, body: req.method === "GET" ? undefined : Buffer.concat(chunks) }).catch(() => null);
    if (!r) { res.writeHead(502); return res.end("API local apagada"); }
    res.writeHead(r.status, { "content-type": r.headers.get("content-type") || "application/json" });
    return res.end(Buffer.from(await r.arrayBuffer()));
  }
  if (process.env.LOCAL_API === "1" && req.url.split("?")[0] === "/config.js") { // usar Postgres local en vez de Supabase
    res.writeHead(200, { "content-type": "text/javascript", "cache-control": "no-store" });
    return res.end('window.CUY_CONFIG = { apiUrl: "/api", anonKey: "" };');
  }
  if (req.url.startsWith("/__dev/seed?")) { // solo desarrollo: deja una sesión en localStorage y redirige
    const q = new URL(req.url, "http://x").searchParams;
    const store = { sessions: { [q.get("code")]: { token: q.get("token"), name: q.get("name"), eventName: "", at: 1 } }, admins: {} };
    res.writeHead(200, { "content-type": "text/html" });
    return res.end(`<script>localStorage.setItem("cuysecreto:v1", ${JSON.stringify(JSON.stringify(store))});location.replace("/#/yo/${q.get("code")}")</script>`);
  }
  const path = normalize(decodeURIComponent(req.url.split("?")[0])).replace(/^(\.\.[/\\])+/, "");
  const file = join(ROOT, path.endsWith("/") ? path + "index.html" : path);
  try {
    const body = await readFile(file);
    res.writeHead(200, { "content-type": TYPES[extname(file)] || "application/octet-stream", "cache-control": "no-store" });
    res.end(body);
  } catch { res.writeHead(404); res.end("No encontrado"); }
}).listen(PORT, () => console.log(`CuySecreto dev → http://localhost:${PORT}`));
