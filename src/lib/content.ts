import panama from '../data/news-panama.json';
import intl from '../data/news-intl.json';
import digital from '../data/news-digital.json';
import eduRaw from '../data/education-digital.json';
import banksRaw from '../data/banks.json';
import glossaryRaw from '../data/glossary.json';
import indicatorsRaw from '../data/indicators.json';

export type ContentType = 'noticia' | 'analisis' | 'opinion' | 'educativo' | 'patrocinado';
export interface NewsItem { id: string; title: string; summary: string; date: string; source: string; url: string; category: string; type: ContentType; country: string; banks: string[]; tags: string[]; lang?: string; stale?: boolean; manual?: boolean }
export interface Article { id: string; section: string; type: ContentType; title: string; date: string; author?: string; aiAssisted?: boolean; sources?: { name: string; url: string; date?: string }[]; body: string[] }
const articleFiles = import.meta.glob<Article>('../../content/articles/*.json', { eager: true, import: 'default' });

// Los ítems marcados `stale` (fuente caída) nunca se muestran al público.
const visible = (n: NewsItem) => !n.stale;
/** Las noticias con más de FEED_MAX_DAYS días no aparecen en los feeds principales (siguen disponibles en el buscador). */
export const FEED_MAX_DAYS = 60;
export function daysOld(iso: string, now = new Date()) { return Math.floor((now.getTime() - new Date(iso + 'T12:00:00Z').getTime()) / 86400000); }
export const isRecent = (n: { date: string }, now = new Date()) => daysOld(n.date, now) <= FEED_MAX_DAYS;
const byDateDesc = (a: NewsItem, b: NewsItem) => b.date.localeCompare(a.date);
export const newsPanamaArchive = (panama as NewsItem[]).filter(visible);
const newsIntlAll = (intl as { items: NewsItem[] }).items.filter(visible);
const newsDigitalAll = (digital as NewsItem[]).filter(visible).sort(byDateDesc);
export const newsPanama = newsPanamaArchive.filter((n) => isRecent(n));
export const newsIntl = newsIntlAll.filter((n) => isRecent(n));
export const intlMeta = intl as unknown as { lastRun: string; sources: Record<string, { ok: boolean; fetchedAt: string | null; count: number; error?: string }> };
export const newsDigital = newsDigitalAll.filter((n) => isRecent(n));
export interface EduSection { h: string; p?: string[]; ul?: string[] }
export interface EduPiece { id: string; title: string; summary: string; date: string; aiAssisted: boolean; sections: EduSection[]; sources: { name: string; url: string }[] }
export const eduPieces = eduRaw as EduPiece[];
/** Feed principal: solo noticias recientes. */
export const allNews: NewsItem[] = [...newsPanama, ...newsIntl, ...newsDigital].sort(byDateDesc);
/** Archivo completo (incluye noticias antiguas): solo para el buscador. */
export const allNewsArchive: NewsItem[] = [...newsPanamaArchive, ...newsIntlAll, ...newsDigitalAll].sort(byDateDesc);
export const articles: Article[] = Object.values(articleFiles).sort((a, b) => b.date.localeCompare(a.date));
export const AI_LABEL = 'Contenido elaborado con asistencia de IA, revisado editorialmente';
export const banks = banksRaw;
export const glossary = glossaryRaw as { term: string; def: string }[];
export const indicators = indicatorsRaw;
export const CONTENT_UPDATED = newsPanamaArchive.reduce((m, n) => (n.date > m ? n.date : m), '');

export const TYPE_LABEL: Record<ContentType, string> = { noticia: 'Noticia', analisis: 'Análisis', opinion: 'Opinión', educativo: 'Educativo', patrocinado: 'Patrocinado' };
export const CATEGORY_LABEL: Record<string, string> = { regulacion: 'Regulación', sistema: 'Sistema bancario', bancos: 'Bancos', pagos: 'Pagos', credito: 'Crédito', tecnologia: 'Tecnología', ciberseguridad: 'Ciberseguridad', economia: 'Economía', internacional: 'Internacional', 'activos-digitales': 'Activos digitales' };

export function formatDate(iso: string) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString('es-PA', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
}
export interface SearchFilters { q: string; category: string; bank: string; country: string; from: string; to: string; type: string }
const norm = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
export function searchNews(items: NewsItem[], f: Partial<SearchFilters>): NewsItem[] {
  const terms = norm(f.q ?? '').split(/\s+/).filter(Boolean);
  return items.filter((n) => {
    const hay = norm(`${n.title} ${n.summary} ${n.source} ${n.tags.join(' ')}`);
    return terms.every((t) => hay.includes(t)) && (!f.category || n.category === f.category) && (!f.bank || n.banks.includes(f.bank)) && (!f.country || n.country === f.country) && (!f.type || n.type === f.type) && (!f.from || n.date >= f.from) && (!f.to || n.date <= f.to);
  });
}
export type DigitalScope = 'panama' | 'internacional' | 'banca';
export const DIGITAL_SCOPE_LABEL: Record<DigitalScope, string> = { panama: 'Panamá', internacional: 'Internacional', banca: 'Banca' };
/** Ámbitos de una noticia de activos digitales: Panamá (país o etiqueta «Panamá»), Internacional (resto) y Banca (etiqueta «banca»). */
export function digitalScopes(n: NewsItem): DigitalScope[] {
  const s: DigitalScope[] = [];
  if (n.country === 'Panamá' || n.tags.includes('Panamá')) s.push('panama');
  if (n.country !== 'Panamá') s.push('internacional');
  if (n.tags.map((x) => x.toLowerCase()).includes('banca')) s.push('banca');
  return s;
}
export function filterDigitalNews(items: NewsItem[], scope: DigitalScope | ''): NewsItem[] { return scope ? items.filter((n) => digitalScopes(n).includes(scope)) : items; }

export function searchSite(q: string) {
  const t = norm(q.trim());
  if (!t) return { news: [], articles: [], glossary: [], digital: [] };
  const m = (s: string) => norm(s).includes(t);
  return {
    news: searchNews(allNewsArchive, { q }),
    articles: articles.filter((a) => m(a.title + ' ' + a.body.join(' '))),
    glossary: glossary.filter((g) => m(g.term + ' ' + g.def)),
    digital: eduPieces.filter((e) => m(e.title + ' ' + e.summary + ' ' + e.sections.map((x) => x.h + ' ' + (x.p ?? []).join(' ') + ' ' + (x.ul ?? []).join(' ')).join(' '))),
  };
}
