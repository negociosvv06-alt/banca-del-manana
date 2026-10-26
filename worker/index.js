// Worker del portal: redirecciones, 404 reales y metadatos SEO por ruta (HTMLRewriter).
// Los archivos de /assets/* no pasan por aquí (run_worker_first excluye /assets/*).
// Datos generados en el build (scripts/postbuild.mjs): /routes.json, /meta-index.json y /meta/articulo/<id>.json.
const SITE = "https://bancadelmanana.com";
const SITE_NAME = "Banca del Mañana";
const NOT_FOUND = { t: `Página no encontrada | ${SITE_NAME}`, d: "La dirección no existe o fue movida.", type: "website", noindex: true, ld: [] };

let routesCache = null; // Set de rutas válidas (por instancia del Worker; cada despliegue crea una nueva)
let indexCache = null; // meta-index.json

async function loadJson(env, origin, path) {
  const res = await env.ASSETS.fetch(new Request(new URL(path, origin)));
  if (!res.ok) throw new Error(`${path}: ${res.status}`);
  return res.json();
}
async function getRoutes(env, origin) {
  return (routesCache ??= loadJson(env, origin, "/routes.json").then((r) => new Set(r)).catch((e) => { routesCache = null; throw e; }));
}
async function getIndex(env, origin) {
  return (indexCache ??= loadJson(env, origin, "/meta-index.json").catch((e) => { indexCache = null; throw e; }));
}
async function getMeta(env, origin, path) {
  if (path.startsWith("/articulo/")) return loadJson(env, origin, `/meta/articulo/${path.slice(10)}.json`);
  return (await getIndex(env, origin))[path];
}

// Los JSON-LD van en <script>: se escapa "<" para que ningún texto pueda cerrar la etiqueta.
const ldJson = (o) => JSON.stringify(o).replace(/</g, "\\u003c").replace(/\u2028/g, "\\u2028").replace(/\u2029/g, "\\u2029");

function rewriteHead(response, path, m, status) {
  const url = SITE + (path === "/" ? "/" : path);
  const image = `${SITE}/og.png`;
  const attr = (v) => ({ element: (e) => e.setAttribute("content", v) });
  const rw = new HTMLRewriter()
    .on("title", { element: (e) => e.setInnerContent(m.t) })
    .on('meta[name="description"]', attr(m.d))
    .on('meta[property="og:title"]', attr(m.t))
    .on('meta[property="og:description"]', attr(m.d))
    .on('meta[property="og:url"]', attr(url))
    .on('meta[property="og:image"]', attr(image))
    .on('meta[property="og:type"]', attr(m.type === "article" ? "article" : "website"))
    .on('meta[name="twitter:card"]', { element: (e) => e.remove() })
    .on('link[rel="canonical"]', status === 404 ? { element: (e) => e.remove() } : { element: (e) => e.setAttribute("href", url) })
    .on("head", {
      element(e) {
        let extra = `<meta name="twitter:card" content="summary_large_image">`;
        extra += `<meta name="twitter:title" content="${esc(m.t)}"><meta name="twitter:description" content="${esc(m.d)}"><meta name="twitter:image" content="${image}">`;
        extra += `<meta property="og:image:alt" content="${SITE_NAME}">`;
        if (m.type === "article" && m.pub) extra += `<meta property="article:published_time" content="${esc(m.pub)}">`;
        if (m.noindex) extra += `<meta name="robots" content="noindex">`;
        for (const o of m.ld || []) extra += `<script type="application/ld+json">${ldJson(o)}</script>`;
        e.append(extra, { html: true });
      },
    });
  return rw.transform(response);
}
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    // Forzar HTTPS y dominio canónico (Google listaba variantes http:// como "alternativa con canónica").
    const needsHttps = url.protocol === "http:" || request.headers.get("x-forwarded-proto") === "http";
    const needsHost = url.hostname.endsWith(".workers.dev") || url.hostname === "www.bancadelmanana.com";
    if (needsHttps || needsHost) {
      url.hostname = "bancadelmanana.com";
      url.protocol = "https:";
      url.port = "";
      return Response.redirect(url.toString(), 301);
    }
    // Enlaces antiguos de «Bancos y comparador» (sección eliminada) → calculadoras.
    if (url.pathname === "/bancos" || url.pathname.startsWith("/bancos/")) {
      url.pathname = "/calculadoras"; url.search = ""; url.hash = "";
      return Response.redirect(url.toString(), 301);
    }
    if (request.method !== "GET" && request.method !== "HEAD") return env.ASSETS.fetch(request);

    let path = url.pathname;
    if (path === "/index.html") { url.pathname = "/"; return Response.redirect(url.toString(), 301); }
    // Archivos estáticos (favicon, og.png, sitemap, robots, datos del build…): directo; si no existen, 404 (no el SPA).
    if (/\.[a-z0-9]{1,8}$/i.test(path)) {
      const res = await env.ASSETS.fetch(request);
      if (res.status === 200 && (res.headers.get("content-type") || "").startsWith("text/html")) {
        return new Response("No encontrado", { status: 404, headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store", "x-content-type-options": "nosniff" } });
      }
      return res;
    }
    // «/ruta/» → «/ruta» (una sola URL por página).
    if (path.length > 1 && path.endsWith("/")) { url.pathname = path.replace(/\/+$/, "") || "/"; return Response.redirect(url.toString(), 301); }

    // Página de la app: se sirve el index.html del SPA con los metadatos de la ruta.
    const shell = await env.ASSETS.fetch(new Request(new URL("/", url), { headers: { accept: "text/html" } }));
    if (!shell.ok) return shell;
    let meta, status = 200;
    try {
      const routes = await getRoutes(env, url);
      meta = routes.has(path) ? await getMeta(env, url, path) : undefined;
    } catch (e) {
      // Si los datos del build no están disponibles, se sirve el HTML genérico (200) en lugar de fallar.
      return shell;
    }
    if (!meta) { meta = NOT_FOUND; status = 404; }
    const out = rewriteHead(shell, path, meta, status);
    const headers = new Headers(out.headers);
    headers.delete("etag"); headers.delete("content-length"); // el cuerpo cambia por ruta
    headers.set("cache-control", status === 404 ? "no-store" : "public, max-age=0, must-revalidate");
    headers.set("content-type", "text/html; charset=utf-8");
    return new Response(out.body, { status, headers });
  },
};
