// Ingesta de noticias internacionales desde RSS oficiales verificados.
// Uso: npm run ingest. Si una fuente falla, se omiten sus ítems (no se publican) y el fallo solo se registra en la salida.
import { XMLParser } from 'fast-xml-parser';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { SOURCES } from './sources.mjs';

const OUT = new URL('../src/data/news-intl.json', import.meta.url);
const prev = existsSync(OUT) ? JSON.parse(readFileSync(OUT, 'utf8')) : { items: [], sources: {} };
const parser = new XMLParser({ ignoreAttributes: false });
const strip = (s = '') => String(s).replace(/<[^>]*>/g, ' ').replace(/&[a-z#0-9]+;/gi, ' ').replace(/\s+/g, ' ').trim().slice(0, 300);
const httpsOnly = (u) => (typeof u === 'string' && u.startsWith('https://') ? u : null);

function adapt(src, xml) {
  const doc = parser.parse(xml);
  const items = doc?.rss?.channel?.item ?? doc?.['rdf:RDF']?.item ?? [];
  return (Array.isArray(items) ? items : [items]).map((it) => {
    const date = new Date(it.pubDate ?? it['dc:date'] ?? '');
    const link = httpsOnly(typeof it.link === 'string' ? it.link : it.link?.['#text'] ?? it['@_rdf:about']);
    if (!link || isNaN(date)) return null;
    return { id: `${src.id}-${Buffer.from(link).toString('base64url').slice(-24)}`, title: strip(it.title), summary: strip(it.description), date: date.toISOString().slice(0, 10), source: src.name, url: link, category: 'internacional', type: 'noticia', country: src.country, lang: src.lang, banks: [], tags: [src.id.toUpperCase()] };
  }).filter(Boolean).slice(0, 12);
}

const now = new Date().toISOString();
const out = { lastRun: now, sources: {}, items: [] };
for (const src of SOURCES.filter((s) => s.type === 'rss')) {
  try {
    const res = await fetch(src.url, { headers: { 'User-Agent': 'BancaDelManana/1.0 (+ingesta RSS)' }, signal: AbortSignal.timeout(20000) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const items = adapt(src, await res.text());
    if (!items.length) throw new Error('Sin elementos');
    out.items.push(...items);
    out.sources[src.id] = { ok: true, fetchedAt: now, count: items.length };
    console.log(`✓ ${src.id}: ${items.length}`);
  } catch (e) {
    // Fuente caída: se omiten sus ítems (sin marca visible para el visitante); solo se registra en el log.
    out.sources[src.id] = { ok: false, error: String(e.message ?? e), fetchedAt: prev.sources?.[src.id]?.fetchedAt ?? null, count: 0 };
    console.warn(`✗ ${src.id}: ${e.message} (se omiten sus ítems)`);
  }
}
out.items.sort((a, b) => b.date.localeCompare(a.date));
writeFileSync(OUT, JSON.stringify(out, null, 1));
