import { useEffect, type ReactNode } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CATEGORY_LABEL, TYPE_LABEL, formatDate, type NewsItem, type ContentType } from '../lib/content';

export const SITE = { name: 'Banca del Mañana', url: (import.meta.env.VITE_SITE_URL as string | undefined) ?? 'https://negociosvv06-alt.github.io/banca-del-manana' };

export function useSeo(title: string, description: string) {
  useEffect(() => {
    document.title = title ? `${title} | ${SITE.name}` : `${SITE.name} – Banca, finanzas e innovación en Panamá`;
    const set = (sel: string, attr: string, val: string) => { const el = document.querySelector(sel); if (el) el.setAttribute(attr, val); };
    set('meta[name="description"]', 'content', description);
    set('meta[property="og:title"]', 'content', document.title);
    set('meta[property="og:description"]', 'content', description);
    set('link[rel="canonical"]', 'href', new URL(SITE.url).origin + window.location.pathname);
  }, [title, description]);
}

export function Badge({ type }: { type: ContentType }) { return <span className={`badge badge-${type}`}>{TYPE_LABEL[type]}</span>; }

export function NewsCard({ n }: { n: NewsItem }) {
  return (
    <article className="card news-card">
      <div className="meta"><Badge type={n.type} /><span className="cat">{CATEGORY_LABEL[n.category] ?? n.category}</span>{n.lang === 'en' && <span className="lang" title="Contenido original en inglés">EN</span>}</div>
      <h3><a href={n.url} target="_blank" rel="noopener noreferrer">{n.title}</a></h3>
      {n.summary && <p>{n.summary}</p>}
      <p className="source">Fuente: <a href={n.url} target="_blank" rel="noopener noreferrer">{n.source}</a> · <time dateTime={n.date}>{formatDate(n.date)}</time></p>
    </article>
  );
}

export function Empty({ title, children }: { title: string; children?: ReactNode }) {
  return <div className="empty" role="status"><strong>{title}</strong>{children && <div>{children}</div>}</div>;
}

export function PageHeader({ title, intro, children }: { title: string; intro?: string; children?: ReactNode }) {
  return <header className="page-header"><h1>{title}</h1>{intro && <p className="lead">{intro}</p>}{children}</header>;
}

export function Paginated<T>({ items, perPage, render, label }: { items: T[]; perPage: number; render: (t: T) => ReactNode; label: string }) {
  const [params] = useSearchParams();
  const pages = Math.max(1, Math.ceil(items.length / perPage));
  const page = Math.min(pages, Math.max(1, Number(params.get('p')) || 1));
  const link = (p: number) => { const q = new URLSearchParams(params); q.set('p', String(p)); return `?${q}`; };
  return (
    <>
      <div className="grid">{items.slice((page - 1) * perPage, page * perPage).map(render)}</div>
      {pages > 1 && <nav className="pagination" aria-label={`Paginación de ${label}`}>
        {page > 1 && <Link to={link(page - 1)}>← Anterior</Link>}
        <span aria-current="page">Página {page} de {pages}</span>
        {page < pages && <Link to={link(page + 1)}>Siguiente →</Link>}
      </nav>}
    </>
  );
}

export const usd = (n: number) => Number.isFinite(n) ? n.toLocaleString('es-PA', { style: 'currency', currency: 'USD' }) : '—';
