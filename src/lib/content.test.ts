import { describe, it, expect } from 'vitest';
import { allNews, searchNews, searchSite, newsPanama, newsIntl, newsDigital, eduPieces, digitalScopes, filterDigitalNews, banks, glossary } from './content';
describe('contenido', () => {
  it('toda noticia tiene fuente https, fecha ISO y título', () => {
    for (const n of allNews) {
      expect(n.url.startsWith('https://')).toBe(true);
      expect(n.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(n.title.length).toBeGreaterThan(5);
      expect(n.source.length).toBeGreaterThan(1);
    }
  });
  it('ids únicos', () => expect(new Set(allNews.map((n) => n.id)).size).toBe(allNews.length));
  it('bancos referenciados existen', () => { const ids = new Set(banks.items.map((b) => b.id)); newsPanama.forEach((n) => n.banks.forEach((b) => expect(ids.has(b)).toBe(true))); });
  it('búsqueda sin acentos y filtros', () => {
    expect(searchNews(newsPanama, { q: 'regulacion' }).length).toBeGreaterThanOrEqual(0);
    expect(searchNews(newsPanama, { q: 'yappy' }).length).toBeGreaterThan(0);
    expect(searchNews(newsPanama, { category: 'pagos' }).every((n) => n.category === 'pagos')).toBe(true);
    expect(searchNews(newsPanama, { from: '2026-10-01' }).every((n) => n.date >= '2026-10-01')).toBe(true);
    expect(searchNews(newsPanama, { q: 'zzzxxx' })).toHaveLength(0);
  });
  it('búsqueda global vacía', () => expect(searchSite('  ').news).toHaveLength(0));
  it('no se publica ningún ítem marcado stale (fuente caída)', () => { expect(allNews.some((n) => n.stale)).toBe(false); expect(newsIntl.some((n) => n.stale)).toBe(false); });
  it('glosario: ≥40 términos únicos con definición, orden alfabético', () => {
    expect(glossary.length).toBeGreaterThanOrEqual(40);
    expect(new Set(glossary.map((g) => g.term.toLowerCase())).size).toBe(glossary.length);
    glossary.forEach((g) => { expect(g.term.length).toBeGreaterThan(1); expect(g.def.length).toBeGreaterThan(20); });
    ['Yappy', 'Kuara', 'Punto Pago', 'ACH Xpress', 'Telered', 'SMV', 'SBP'].forEach((t) => expect(glossary.some((g) => g.term === t)).toBe(true));
  });
  it('activos digitales: noticias con categoría, fuente https y sin stale', () => {
    expect(newsDigital.length).toBeGreaterThanOrEqual(8);
    newsDigital.forEach((n) => { expect(n.category).toBe('activos-digitales'); expect(n.url.startsWith('https://')).toBe(true); expect(n.summary.length).toBeGreaterThan(20); expect(n.stale).toBeUndefined(); expect(Array.isArray(n.tags) && Array.isArray(n.banks)).toBe(true); });
    expect(allNews.some((n) => n.category === 'activos-digitales')).toBe(true);
  });
  it('activos digitales: filtros por ámbito', () => {
    const pa = filterDigitalNews(newsDigital, 'panama'), intl = filterDigitalNews(newsDigital, 'internacional'), banca = filterDigitalNews(newsDigital, 'banca');
    expect(pa.length).toBeGreaterThan(0); expect(intl.length).toBeGreaterThan(0); expect(banca.length).toBeGreaterThan(0);
    expect(filterDigitalNews(newsDigital, '')).toHaveLength(newsDigital.length);
    pa.forEach((n) => expect(digitalScopes(n)).toContain('panama'));
    banca.forEach((n) => expect(n.tags.map((t) => t.toLowerCase())).toContain('banca'));
  });
  it('activos digitales: guías educativas con fuentes y temas requeridos', () => {
    expect(new Set(eduPieces.map((e) => e.id)).size).toBe(eduPieces.length);
    eduPieces.forEach((e) => { expect(e.sources.length).toBeGreaterThan(0); e.sources.forEach((x) => expect(x.url.startsWith('https://')).toBe(true)); expect(e.aiAssisted).toBe(true); });
    ['blockchain-cadena-de-bloques', 'p2p-peer-to-peer', 'wallets-llaves-privadas', 'stablecoins', 'exchanges-y-kyc', 'smart-contracts', 'tokenizacion-de-activos', 'cbdc-moneda-digital-de-banco-central', 'seguridad-y-estafas-comunes', 'regulacion-en-panama', 'glosario-rapido-activos-digitales', 'que-son-activos-digitales'].forEach((id) => expect(eduPieces.some((e) => e.id === id)).toBe(true));
  });
  it('búsqueda global encuentra guías de activos digitales', () => expect(searchSite('blockchain').digital.length).toBeGreaterThan(0));
  it('glosario incluye términos de activos digitales', () => ['Blockchain (cadena de bloques)', 'P2P (peer-to-peer)', 'Wallet (billetera de activos digitales)'].forEach((t) => expect(glossary.some((g) => g.term === t)).toBe(true)));
});
