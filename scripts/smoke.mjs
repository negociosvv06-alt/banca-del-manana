// Prueba de humo sobre la vista de producción (npm run preview). Uso: node scripts/smoke.mjs [baseUrl]
import { chromium } from 'playwright-core';
const BASE = process.argv[2] || 'http://localhost:4173';
const exe = process.env.CHROME_PATH || '/usr/bin/google-chrome';
const routes = ['/', '/banca-panama', '/banca-panama?cat=pagos', '/internacional', '/activos-digitales', '/activos-digitales/blockchain-cadena-de-bloques', '/activos-digitales/p2p-peer-to-peer', '/bancos', '/inversiones', '/calculadoras', '/calculadoras/prestamo', '/calculadoras/divisas', '/medios-de-pago', '/fintech', '/educacion', '/finanzas-avanzadas', '/opinion', '/glosario', '/acerca', '/metodologia', '/contacto', '/privacidad', '/terminos', '/aviso-legal', '/fuentes', '/buscar?q=yappy', '/articulo/fondo-emergencia', '/no-existe'];
const browser = await chromium.launch({ executablePath: exe, args: ['--no-sandbox'] });
const page = await browser.newPage();
const errors = [];
page.on('console', (m) => m.type() === 'error' && errors.push(`${page.url()}: ${m.text()}`));
page.on('pageerror', (e) => errors.push(`${page.url()}: ${e.message}`));
let fail = 0;
for (const r of routes) {
  const res = await page.goto(BASE + r, { waitUntil: 'networkidle' });
  const h1 = await page.locator('h1').first().textContent().catch(() => '');
  const ok = res.status() === 200 && h1;
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
