// Genera sitemap.xml, robots.txt y 404.html (fallback SPA para GitHub Pages).
import { readFileSync, writeFileSync, copyFileSync, readdirSync } from 'node:fs';
const site = (process.env.VITE_SITE_URL || readFileSync('.env', 'utf8').match(/VITE_SITE_URL=(.*)/)?.[1] || '').trim().replace(/\/$/, '');
const base = site.endsWith((process.env.BASE_PATH || '/').replace(/\/$/, '')) ? '' : (process.env.BASE_PATH || '/').replace(/\/$/, '');
const j = (p) => JSON.parse(readFileSync(p, 'utf8'));
const routes = ['', 'banca-panama', 'internacional', 'bancos', 'calculadoras', 'inversiones', 'medios-de-pago', 'fintech', 'educacion', 'finanzas-avanzadas', 'opinion', 'glosario', 'fuentes', 'acerca', 'metodologia', 'contacto', 'privacidad', 'terminos', 'aviso-legal',
  ...['prestamo', 'ahorro', 'meta', 'plazo-fijo', 'deuda', 'emergencia', 'inflacion', 'vpn-tir', 'divisas'].map((c) => `calculadoras/${c}`),
  ...readdirSync('content/articles').filter((f) => f.endsWith('.json')).map((f) => j('content/articles/' + f)).map((a) => `articulo/${a.id}`)];
const today = new Date().toISOString().slice(0, 10);
writeFileSync('dist/sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${routes.map((r) => `  <url><loc>${site}${base}/${r}</loc><lastmod>${today}</lastmod></url>`).join('\n')}\n</urlset>\n`);
writeFileSync('dist/robots.txt', `User-agent: *\nAllow: /\nSitemap: ${site}${base}/sitemap.xml\n`);
copyFileSync('dist/index.html', 'dist/404.html');
console.log(`postbuild: ${routes.length} rutas en sitemap`);
