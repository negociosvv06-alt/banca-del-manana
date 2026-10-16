import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { clip, articleDescription, buildMeta, parseCalcs, STATIC_PAGES, HOME, MAX_DESC } from './seo.mjs';
const j = (p) => JSON.parse(readFileSync(p, 'utf8'));
const articles = readdirSync('content/articles').filter((f) => f.endsWith('.json')).map((f) => j('content/articles/' + f));
const guides = j('src/data/education-digital.json');
const calcs = parseCalcs(readFileSync('src/pages/Calculators.tsx', 'utf8'));
const records = buildMeta({ site: 'https://bancadelmanana.com', articles, guides, calcs });

describe('descripciones', () => {
  it('clip respeta el máximo y corta en palabra', () => {
    const s = clip('palabra '.repeat(60));
    expect(s.length).toBeLessThanOrEqual(MAX_DESC);
    expect(s.endsWith('…')).toBe(true);
    expect(clip('Texto corto.')).toBe('Texto corto.');
  });
  it('artículo con primer párrafo corto toma el siguiente (texto real, sin inventar)', () => {
    const d = articleDescription(['Uno corto.', '## Título', 'Segundo párrafo real del artículo con más contenido para completar la descripción de forma útil.']);
    expect(d.startsWith('Uno corto. Segundo párrafo real')).toBe(true);
  });
  it('toda ruta tiene título y descripción no vacíos de ≤155 caracteres', () => {
    for (const [p, r] of records) { expect(r.t, p).toBeTruthy(); expect(r.d.length, p).toBeGreaterThan(20); expect(r.d.length, p).toBeLessThanOrEqual(MAX_DESC); }
  });
  it('los títulos y descripciones no se repiten entre rutas', () => {
    const t = [...records.values()].map((r) => r.t);
    expect(new Set(t).size).toBe(t.length);
  });
});
describe('cobertura de rutas', () => {
  it('incluye home, páginas estáticas, 9 calculadoras, guías y todos los artículos', () => {
    expect(records.has('/')).toBe(true);
    for (const s of Object.keys(STATIC_PAGES)) expect(records.has('/' + s)).toBe(true);
    expect(calcs).toHaveLength(9);
    for (const c of calcs) expect(records.has('/calculadoras/' + c.id)).toBe(true);
    for (const g of guides) expect(records.has('/activos-digitales/' + g.id)).toBe(true);
    for (const a of articles) expect(records.has('/articulo/' + a.id)).toBe(true);
  });
  it('coincide con las rutas de App.tsx', () => {
    const app = readFileSync('src/App.tsx', 'utf8');
    const paths = [...app.matchAll(/path="([^":*]+)"/g)].map((m) => m[1]).filter((p) => !p.startsWith('bancos'));
    for (const p of paths) expect(records.has('/' + p) || records.has('/' + p.replace(/\/$/, ''))).toBe(true);
    const sections = [...app.matchAll(/\[('inversiones'[^\]]+)\]/g)][0][1].match(/'([\w-]+)'/g).map((s) => s.slice(1, -1));
    for (const s of sections) expect(records.has('/' + s)).toBe(true);
  });
});
describe('JSON-LD', () => {
  it('artículos: NewsArticle con fecha y autor + BreadcrumbList; opinión como OpinionNewsArticle', () => {
    const a = articles.find((x) => x.type === 'opinion');
    const ld = records.get('/articulo/' + a.id).ld;
    expect(ld[0]['@type']).toBe('OpinionNewsArticle');
    expect(ld[0].datePublished).toBe(a.date);
    expect(ld[0].author.name).toBe('Banca del Mañana');
    expect(ld[1]['@type']).toBe('BreadcrumbList');
    const n = articles.find((x) => x.type !== 'opinion');
    expect(records.get('/articulo/' + n.id).ld[0]['@type']).toBe('NewsArticle');
  });
  it('home: WebSite con SearchAction', () => {
    expect(records.get('/').ld[0]['@type']).toBe('WebSite');
    expect(records.get('/').ld[0].potentialAction['@type']).toBe('SearchAction');
  });
});
describe('los textos SEO reflejan el contenido real de las páginas (anti-desvío)', () => {
  const pages = readFileSync('src/pages/Pages.tsx', 'utf8') + readFileSync('src/pages/DigitalAssets.tsx', 'utf8') + readFileSync('src/pages/Calculators.tsx', 'utf8');
  it('cada título de página estática aparece en el código de la página', () => {
    for (const [slug, p] of Object.entries(STATIC_PAGES)) expect(pages.includes(p.name), `${slug}: «${p.name}»`).toBe(true);
    expect(pages.includes(HOME.description)).toBe(true);
  });
});
