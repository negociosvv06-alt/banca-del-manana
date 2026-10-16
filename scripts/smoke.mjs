// Prueba de humo. Uso: node scripts/smoke.mjs [baseUrl]
//  - Sin Worker (npm run preview, http://localhost:4173): rutas inexistentes responden 200 con la pantalla 404 del SPA.
//  - Con Worker (wrangler dev / producción): WORKER=1 node scripts/smoke.mjs http://localhost:8787
//    además exige 404 reales, redirecciones 301 y metadatos propios por ruta (título, descripción, canonical, JSON-LD).
import { chromium } from 'playwright-core';
import { readFileSync, existsSync } from 'node:fs';
const WORKER = !!process.env.WORKER;
const BASE = process.argv[2] || 'http://localhost:4173';
const exe = process.env.CHROME_PATH || '/usr/bin/google-chrome';
const BAD = ['/no-existe', '/articulo/no-existe', '/activos-digitales/no-existe', '/calculadoras/no-existe'];
const routes = ['/', '/banca-panama', '/banca-panama?cat=pagos', '/internacional', '/activos-digitales', '/activos-digitales/blockchain-cadena-de-bloques', '/activos-digitales/p2p-peer-to-peer', '/bancos', '/inversiones', '/calculadoras', '/calculadoras/prestamo', '/calculadoras/divisas', '/medios-de-pago', '/fintech', '/educacion', '/finanzas-avanzadas', '/opinion', '/glosario', '/acerca', '/metodologia', '/contacto', '/privacidad', '/terminos', '/aviso-legal', '/fuentes', '/buscar?q=yappy', '/articulo/fondo-emergencia', ...BAD];
// Todas las rutas válidas del build (dist/routes.json) deben abrir (200) y mostrar un h1.
if (existsSync('dist/routes.json')) for (const r of JSON.parse(readFileSync('dist/routes.json', 'utf8'))) if (!routes.includes(r)) routes.push(r);
let fail = 0;
if (WORKER) {
  const get = (p, o) => fetch(BASE + p, { redirect: 'manual', ...o });
  const titles = new Set(), descs = new Set();
  for (const r of JSON.parse(readFileSync('dist/routes.json', 'utf8'))) {
    const res = await get(r); const html = await res.text();
    const t = html.match(/<title>([^<]*)<\/title>/)?.[1], d = html.match(/name="description" content="([^"]*)"/)?.[1], c = html.match(/rel="canonical" href="([^"]*)"/)?.[1];
    const okMeta = res.status === 200 && t && d && d.length <= 155 + 20 && c === 'https://bancadelmanana.com' + (r === '/' ? '/' : r) && !titles.has(t) && !descs.has(d);
    titles.add(t); descs.add(d);
    if (!okMeta) { fail++; console.log(`✗ meta ${r} [${res.status}] t=${t} c=${c}`); }
    if (r.startsWith('/articulo/') && !/"@type":"(News|OpinionNews)Article"/.test(html)) { fail++; console.log('✗ sin JSON-LD de artículo ' + r); }
  }
  console.log(`✓ metadatos propios y canonical en ${titles.size} rutas`);
  for (const b of BAD) { const res = await get(b); if (res.status !== 404) { fail++; console.log(`✗ ${b} debería ser 404, fue ${res.status}`); } }
  for (const [a, b] of [['/bancos', '/calculadoras'], ['/bancos/x', '/calculadoras'], ['/glosario/', '/glosario']]) { const res = await get(a); if (res.status !== 301 || !res.headers.get('location')?.endsWith(b)) { fail++; console.log(`✗ ${a} → ${res.status} ${res.headers.get('location')}`); } }
  console.log('✓ 404 reales y redirecciones 301 comprobadas');
}
const browser = await chromium.launch({ executablePath: exe, args: ['--no-sandbox'] });
const page = await browser.newPage();
const errors = [];
page.on('console', (m) => m.type() === 'error' && !(WORKER && /status of 404/.test(m.text()) && /no-existe/.test(page.url())) && errors.push(`${page.url()}: ${m.text()}`));
page.on('pageerror', (e) => errors.push(`${page.url()}: ${e.message}`));
for (const r of routes) {
  const res = await page.goto(BASE + r, { waitUntil: 'networkidle' });
  const h1 = await page.locator('h1').first().textContent().catch(() => '');
  const bad = BAD.includes(r) || r === '/no-existe';
  const ok = res.status() === (bad && WORKER ? 404 : 200) && h1;
  if (!ok) fail++;
  console.log(`${ok ? '✓' : '✗'} ${r} [${res.status()}] ${h1?.trim().slice(0, 60)}`);
}
// Calculadora: valor conocido
await page.goto(BASE + '/calculadoras/prestamo');
const txt = await page.locator('.result').textContent();
console.log(txt.includes('888.49') ? '✓ préstamo 10,000/12%/12m = 888.49' : (fail++, '✗ cuota inesperada: ' + txt));
await page.fill('#l-p', '-5'); console.log((await page.locator('#l-p-err').isVisible()) ? '✓ validación de negativos' : (fail++, '✗ sin validación'));
// Búsqueda
await page.goto(BASE + '/buscar?q=acuerdo');
console.log('✓ búsqueda "acuerdo": ' + (await page.locator('[role=status]').first().textContent()));
// FX
await page.goto(BASE + '/calculadoras/divisas', { waitUntil: 'networkidle' });
console.log('FX: ' + (await page.locator('.result').textContent()).slice(0, 200));
// Enlaces internos rotos
await page.goto(BASE + '/');
const links = [...new Set(await page.$$eval('a[href^="/"]', (as) => as.map((a) => a.getAttribute('href'))))];
for (const l of links) { const p2 = await browser.newPage(); await p2.goto(BASE + l); const n = await p2.locator('.notfound').count(); if (n) { fail++; console.log('✗ enlace roto ' + l); } await p2.close(); }
console.log(`✓ ${links.length} enlaces internos de la portada revisados`);
// Capturas
if (process.env.SHOTS) {
  await page.setViewportSize({ width: 1366, height: 900 });
  await page.goto(BASE + '/', { waitUntil: 'networkidle' }); await page.screenshot({ path: 'screenshots/inicio-escritorio.png', fullPage: true });
  await page.goto(BASE + '/calculadoras/prestamo'); await page.click('text=Ver tabla de amortización'); await page.screenshot({ path: 'screenshots/calculadora-prestamo.png', fullPage: true });
  await page.goto(BASE + '/activos-digitales', { waitUntil: 'networkidle' }); await page.screenshot({ path: 'screenshots/activos-digitales.png', fullPage: true });
  await page.evaluate(() => localStorage.setItem('theme', 'dark')); await page.goto(BASE + '/banca-panama', { waitUntil: 'networkidle' }); await page.screenshot({ path: 'screenshots/banca-panama-oscuro.png' });
  await page.evaluate(() => localStorage.setItem('theme', 'light'));
  const m = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  await m.goto(BASE + '/', { waitUntil: 'networkidle' }); await m.screenshot({ path: 'screenshots/movil-inicio.png' });
  await m.click('.menu-btn'); await m.screenshot({ path: 'screenshots/movil-menu.png' });
  await m.goto(BASE + '/no-existe'); await m.screenshot({ path: 'screenshots/movil-404.png' });
}
console.log(errors.length ? '✗ Errores de consola:\n' + errors.join('\n') : '✓ Sin errores de consola');
await browser.close();
process.exit(fail || errors.length ? 1 : 0);
