# Banca del Mañana

Portal de información y educación financiera sobre la banca en Panamá y el mundo. Sitio estático (Vite + React + TypeScript), en español, listo para hosting gratuito.

## Ejecutar localmente
Requisitos: Node.js 20+.
```bash
npm install
npm run dev          # desarrollo: http://localhost:5173
npm run typecheck    # tipos
npm test             # 30 pruebas (calculadoras + contenido)
npm run build        # valida contenido, compila, genera sitemap/robots/404
npm run preview      # vista de producción: http://localhost:4173
node scripts/smoke.mjs   # prueba de humo de rutas, calculadora, búsqueda y consola (requiere Chrome; CHROME_PATH)
npm run ingest       # descarga noticias de RSS oficiales (Fed, BCE, BIS)
```

## Estructura
- `src/lib/calc.ts` – funciones financieras puras (préstamo, amortización, ahorro, meta, plazo fijo, deudas, inflación, fondo de emergencia, VPN, TIR, divisas) + `calc.test.ts`.
- `src/lib/content.ts` – carga, búsqueda y filtros del contenido.
- `content/articles/*.json` – artículos (un archivo por artículo).
- `src/data/*.json` – contenido editorial (noticias de Panamá, glosario, bancos, indicadores, tasas, fuentes). `news-intl.json` lo genera `npm run ingest`.
- `src/pages/` – páginas; `src/components/` – layout y UI.
- `scripts/` – ingesta RSS, validación de contenido, postbuild (sitemap/robots/404), prueba de humo.
- `public/_redirects`, `public/_headers` (Cloudflare Pages/Netlify), `vercel.json` (Vercel): fallback SPA y cabeceras de seguridad (CSP).

## Flujo editorial (sin panel inseguro)
No hay panel de administración con usuario/contraseña: el contenido se edita en los JSON de `src/data/` mediante commits o pull requests en GitHub (control de acceso = permisos del repositorio, con historial y revisión). `npm run build` rechaza noticias sin fuente https, sin fecha, con fecha futura o con tipo inválido.
Reglas: cada noticia lleva `url`, `source`, `date` (fecha de publicación) y `type` (noticia, analisis, opinion, educativo, patrocinado). Nunca inventar tasas: el comparador muestra "No publicado" hasta que `rates.json` tenga entradas verificadas.
Opción futura: Decap CMS (gratuito, basado en Git) requiere un proveedor OAuth de GitHub (p. ej. un Worker de Cloudflare); no está configurado.

## Variables de entorno (todas públicas, ver `.env.example`)
| Variable | Uso |
|---|---|
| `VITE_SITE_URL` | URL pública (canonical, OG, sitemap). Por defecto `https://banca-del-manana.pages.dev` (cámbiela por la real). |
| `VITE_CONTACT_EMAIL` | Correo público del formulario de contacto (mailto). Sin ella, el formulario queda desactivado. |
| `VITE_FX_API_URL` | API de divisas sin clave (por defecto Frankfurter). |
| `BASE_PATH` | `/` (Cloudflare/Vercel) o `/<repo>/` (GitHub Pages de proyecto). |
No se necesitan claves secretas. No ponga secretos en variables `VITE_` (se incrustan en el frontend).

## Despliegue gratuito
Recomendado: **Cloudflare Pages** (plan gratuito con ancho de banda generoso, 500 compilaciones/mes, HTTPS y subdominio `*.pages.dev`; verifique límites vigentes en https://developers.cloudflare.com/pages/platform/limits/).
1. Cree un repositorio en GitHub y suba este proyecto (`git push`).
2. Cloudflare → Workers & Pages → Create → Pages → Connect to Git → elija el repo.
3. Framework preset: *Vite*. Build command: `npm run build`. Output: `dist`. Variable `NODE_VERSION=20`, `VITE_SITE_URL=https://<proyecto>.pages.dev`, `VITE_CONTACT_EMAIL=...`.
4. Deploy. `_redirects` evita 404 al recargar rutas internas; `_headers` aplica la CSP.
5. Dominio propio (opcional, tiene costo anual): Pages → Custom domains → agregar y seguir las instrucciones DNS (CNAME). HTTPS es automático.

**Vercel (alternativa):** Import Project → Framework Vite → build `npm run build`, output `dist`. `vercel.json` ya trae rewrites. Plan Hobby gratuito es para uso no comercial; revise los términos si habrá publicidad.

**GitHub Pages (alternativa):** `BASE_PATH=/<repo>/ npm run build`, publique `dist/` con la acción oficial `actions/deploy-pages`. El `404.html` generado sirve de fallback SPA (devuelve código 404 en recargas, lo que afecta SEO). `_headers` no aplica.

**Actualización automática:** `.github/workflows/ingest.yml` ejecuta la ingesta RSS cada 6 horas y hace commit; el hosting conectado redepliega solo. Si una fuente falla, se conservan sus noticias previas marcadas como desactualizadas.

## Fuentes e integraciones
| Fuente | Tipo | Estado |
|---|---|---|
| Fed – press_all.xml | RSS | Verificado y funcionando |
| BCE – rss/press.html | RSS | Verificado y funcionando |
| BIS – all_pressrels.rss | RSS | Verificado y funcionando |
| FMI – News RSS | Manual | Su RSS respondió 429 al verificarlo |
| SBP | Manual | Sin RSS oficial (rss.xml = 404) |
| SMV, MEF, INEC | Manual | Sin integración automática |
| Frankfurter (BCE) | API sin clave | Verificado (CORS OK) en el conversor |

## Limitaciones conocidas
- SPA sin prerenderizado: los buscadores modernos ejecutan JS, pero el SEO por página es mejor con SSG (fase 2: `vite-react-ssg` o Astro).
- Noticias de Panamá curadas manualmente (al 7 oct 2026); no hay ingesta automática de medios locales.
- "Más leídas" vacía hasta conectar analítica real (Cloudflare Web Analytics, gratis y sin cookies).
- Comparador sin tasas: requiere verificación editorial de tarifarios.
- Directorio de bancos: licencias "Pendiente de verificación" contra el registro de la SBP; lista inicial de 10 entidades.
- Sin cotizaciones bursátiles (requieren proveedor con licencia).
- Títulos internacionales en inglés (idioma original); traducción automática no implementada.
- Textos legales pendientes de revisión legal local. Inglés: arquitectura lista para i18n en fase 2 (textos aún embebidos en componentes).

## Artículos diarios (p. ej. "Banca e IA")
Ruta: **`content/articles/AAAA-MM-DD-<id>.json`** (un archivo = un artículo). Plantilla: `content/articles/_plantilla.json.example`.

| Campo | Obligatorio | Valores |
|---|---|---|
| `id` | sí | minúsculas, números y guiones; único (define la URL `/articulo/<id>`) |
| `section` | sí | `inversiones`, `pagos`, `fintech`, `educacion`, `avanzadas`, `opinion` |
| `type` | sí | `noticia`, `analisis`, `opinion`, `educativo`, `patrocinado` |
| `title` | sí | texto |
| `date` | sí | `AAAA-MM-DD` |
| `aiAssisted` | sí | `true` muestra la etiqueta "Contenido elaborado con asistencia de IA, revisado editorialmente"; `false` la oculta |
| `body` | sí | lista de párrafos |
| `author` | no | por defecto "Equipo editorial" |
| `sources` | no (recomendado) | lista de `{ "name", "url" (https), "date" }` |

Cómo publicar: copie la plantilla, renómbrela, complete los campos y haga commit en `main` (o en GitHub: Add file → Create new file). `npm run build` valida el archivo; si algo falta, la compilación falla con el nombre del archivo y el error. El artículo aparece en su sección, en la portada (si es análisis/educativo), en la búsqueda y en el sitemap.

## Publicación actual
- **GitHub Pages (activo):** https://negociosvv06-alt.github.io/banca-del-manana/ — workflow `deploy.yml` (push, cada 6 h y manual) con `BASE_PATH=/banca-del-manana/`. Local: `npm run build:ghpages`.
- **Cloudflare Pages (preparado, no activo):** workflow `cloudflare.yml` con `BASE_PATH=/` y `VITE_SITE_URL=https://banca-del-manana.pages.dev`. Se omite sin fallar mientras no existan los secretos `CLOUDFLARE_API_TOKEN` (permiso *Cloudflare Pages: Edit*) y `CLOUDFLARE_ACCOUNT_ID` en Settings → Secrets and variables → Actions. Antes del primer despliegue cree el proyecto: `npx wrangler@3 pages project create banca-del-manana --production-branch=main`. Local: `npm run build:cloudflare` o `npm run deploy:cloudflare` (requiere `wrangler login`). Wrangler 4 requiere Node 22+.
- Correo de contacto: `VITE_CONTACT_EMAIL=negociosvv06@gmail.com` (en `.env` y en ambos workflows).
