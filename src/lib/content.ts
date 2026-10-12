import panama from '../data/news-panama.json';
import intl from '../data/news-intl.json';
import articlesRaw from '../data/articles.json';
import banksRaw from '../data/banks.json';
import glossaryRaw from '../data/glossary.json';
import indicatorsRaw from '../data/indicators.json';
import ratesRaw from '../data/rates.json';

export type ContentType = 'noticia' | 'analisis' | 'opinion' | 'educativo' | 'patrocinado';
export interface NewsItem { id: string; title: string; summary: string; date: string; source: string; url: string; category: string; type: ContentType; country: string; banks: string[]; tags: string[]; lang?: string; stale?: boolean; staleNote?: string }
export interface Article { id: string; section: string; type: ContentType; title: string; date: string; author?: string; body: string[] }

export const newsPanama = panama as NewsItem[];
export const newsIntl = (intl as { items: NewsItem[] }).items;
export const intlMeta = intl as unknown as { lastRun: string; sources: Record<string, { ok: boolean; fetchedAt: string | null; count: number; error?: string }> };
export const allNews: NewsItem[] = [...newsPanama, ...newsIntl].sort((a, b) => b.date.localeCompare(a.date));
export const articles = articlesRaw as Article[];
export const banks = banksRaw;
export const glossary = glossaryRaw as { term: string; def: string }[];
export const indicators = indicatorsRaw;
export const rates = ratesRaw;
export const CONTENT_UPDATED = newsPanama.reduce((m, n) => (n.date > m ? n.date : m), '');

export const TYPE_LABEL: Record<ContentType, string> = { noticia: 'Noticia', analisis: 'Análisis', opinion: 'Opinión', educativo: 'Educativo', patrocinado: 'Patrocinado' };
export const CATEGORY_LABEL: Record<string, string> = { regulacion: 'Regulación', sistema: 'Sistema bancario', bancos: 'Bancos', pagos: 'Pagos', credito: 'Crédito', tecnologia: 'Tecnología', ciberseguridad: 'Ciberseguridad', economia: 'Economía', internacional: 'Internacional' };

export function formatDate(iso: string) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString('es-PA', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
}
export function daysOld(iso: string, now = new Date()) { return Math.floor((now.getTime() - new Date(iso + 'T12:00:00Z').getTime()) / 86400000); }

export interface SearchFilters { q: string; category: string; bank: string; country: string; from: string; to: string; type: string }
const norm = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
export function searchNews(items: NewsItem[], f: Partial<SearchFilters>): NewsItem[] {
  const terms = norm(f.q ?? '').split(/\s+/).filter(Boolean);
  return items.filter((n) => {
    const hay = norm(`${n.title} ${n.summary} ${n.source} ${n.tags.join(' ')}`);
    return terms.every((t) => hay.includes(t)) && (!f.category || n.category === f.category) && (!f.bank || n.banks.includes(f.bank)) && (!f.country || n.country === f.country) && (!f.type || n.type === f.type) && (!f.from || n.date >= f.from) && (!f.to || n.date <= f.to);
  });
}
export function searchSite(q: string) {
  const t = norm(q.trim());
  if (!t) return { news: [], articles: [], glossary: [], banks: [] };
  const m = (s: string) => norm(s).includes(t);
  return {
    news: searchNews(allNews, { q }),
    articles: articles.filter((a) => m(a.title + ' ' + a.body.join(' '))),
    glossary: glossary.filter((g) => m(g.term + ' ' + g.def)),
    banks: banks.items.filter((b) => m(b.name + ' ' + b.type)),
  };
}
