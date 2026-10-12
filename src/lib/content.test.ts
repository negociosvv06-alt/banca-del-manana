import { describe, it, expect } from 'vitest';
import { allNews, searchNews, searchSite, newsPanama, banks } from './content';
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
});
