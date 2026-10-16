// Genera sitemap.xml, robots.txt, manifiesto de rutas (routes.json) y metadatos por ruta (meta-index.json + meta/articulo/*.json)
// que lee el Worker (worker/index.js). Solo se publica un dominio: el de VITE_SITE_URL.
import { readFileSync, writeFileSync, copyFileSync, readdirSync, mkdirSync, rmSync } from 'node:fs';
import { buildMeta, parseCalcs } from './seo.mjs';
const site = (process.env.VITE_SITE_URL || readFileSync('.env', 'utf8').match(/VITE_SITE_URL=(.*)/)?.[1] || '').trim().replace(/\/$/, '');
const base = site.endsWith((process.env.BASE_PATH || '/').replace(/\/$/, '')) ? '' : (process.env.BASE_PATH || '/').replace(/\/$/, '');
const j = (p) => JSON.parse(readFileSync(p, 'utf8'));
const articles = readdirSync('content/articles').filter((f) => f.endsWith('.json')).map((f) => j('content/articles/' + f)).sort((a, b) => b.date.localeCompare(a.date));
const guides = j('src/data/education-digital.json');
const calcs = parseCalcs(readFileSync('src/pages/Calculators.tsx', 'utf8'));
if (calcs.length < 9) throw new Error(`postbuild: se esperaban 9 calculadoras y se leyeron ${calcs.length}`);

const records = buildMeta({ site: site + base, articles, guides, calcs });
const routes = [...records.keys()];

// Sitemap: todas las rutas indexables. lastmod real para artículos y guías; fecha de compilación para el resto.
const today = new Date().toISOString().slice(0, 10);
const entries = routes.filter((p) => !records.get(p).noindex).map((p) => `  <url><loc>${site}${base}${p === '/' ? '/' : p}</loc><lastmod>${records.get(p).pub || today}</lastmod></url>`);
writeFileSync('dist/sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries.join('\n')}\n</urlset>\n`);
writeFileSync('dist/robots.txt', `User-agent: *\nAllow: /\nSitemap: ${site}${base}/sitemap.xml\n`);

// Manifiesto de rutas válidas (el Worker responde 404 a todo lo demás) y metadatos.
writeFileSync('dist/routes.json', JSON.stringify(routes));
const compact = ([p, r]) => [p, { t: r.t, d: r.d, ...(r.type !== 'website' ? { type: r.type } : {}), ...(r.pub ? { pub: r.pub } : {}), ...(r.noindex ? { noindex: true } : {}), ld: r.ld }];
// meta-index.json: páginas estáticas, calculadoras y guías (pocas y estables). Los artículos crecen cada día: un archivo por artículo.
writeFileSync('dist/meta-index.json', JSON.stringify(Object.fromEntries([...records].filter(([p]) => !p.startsWith('/articulo/')).map(compact))));
rmSync('dist/meta', { recursive: true, force: true });
mkdirSync('dist/meta/articulo', { recursive: true });
for (const [p, r] of records) if (p.startsWith('/articulo/')) writeFileSync(`dist/meta/articulo/${p.slice('/articulo/'.length)}.json`, JSON.stringify(compact([p, r])[1]));
// 404.html solo sirve al espejo antiguo de GitHub Pages (retirado); en la raíz del dominio lo gestiona el Worker.
if (base) copyFileSync('dist/index.html', 'dist/404.html');
console.log(`postbuild: ${routes.length} rutas (sitemap ${entries.length}), metadatos en dist/meta-index.json y dist/meta/articulo/`);
