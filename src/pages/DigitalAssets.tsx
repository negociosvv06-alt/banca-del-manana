import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { AI_LABEL, DIGITAL_SCOPE_LABEL, digitalScopes, eduPieces, filterDigitalNews, formatDate, newsDigital, type DigitalScope, type NewsItem } from '../lib/content';
import { Badge, Empty, PageHeader, useSeo } from '../components/ui';
import NewsletterForm from '../components/NewsletterForm';

export const EDU_DISCLAIMER = 'Contenido educativo, no es asesoría de inversión.';
const SCOPES = Object.keys(DIGITAL_SCOPE_LABEL) as DigitalScope[];
const FEED_STEP = 8;

function DigitalNewsCard({ n }: { n: NewsItem }) {
  return <article className="card da-news-card">
    <div className="meta"><Badge type={n.type} />{digitalScopes(n).map((s) => <span key={s} className="da-chip">{DIGITAL_SCOPE_LABEL[s]}</span>)}{n.lang === 'en' && <span className="lang" title="Contenido original en inglés">EN</span>}</div>
    <h3><a href={n.url} target="_blank" rel="noopener noreferrer">{n.title}</a></h3>
    {n.summary && <p>{n.summary}</p>}
    <p className="source">Fuente: <a href={n.url} target="_blank" rel="noopener noreferrer">{n.source}</a> · <time dateTime={n.date}>{formatDate(n.date)}</time></p>
  </article>;
}

export function DigitalNewsFeed({ items = newsDigital }: { items?: NewsItem[] }) {
  const [sp, setSp] = useSearchParams();
  const raw = sp.get('ambito') ?? '';
  const scope = (SCOPES as string[]).includes(raw) ? (raw as DigitalScope) : '';
  const [shown, setShown] = useState(FEED_STEP);
  const list = filterDigitalNews(items, scope);
  const pick = (s: DigitalScope | '') => { const q = new URLSearchParams(sp); if (s) q.set('ambito', s); else q.delete('ambito'); setSp(q, { replace: true }); setShown(FEED_STEP); };
  return <section className="da-news" aria-labelledby="da-news-h">
    <h2 id="da-news-h">Noticias de activos digitales</h2>
    <div className="da-filters" role="group" aria-label="Filtrar noticias por ámbito">
      {([['', 'Todas'], ...SCOPES.map((s) => [s, DIGITAL_SCOPE_LABEL[s]])] as [string, string][]).map(([v, l]) => <button key={v || 'all'} type="button" className="da-filter" aria-pressed={scope === v} onClick={() => pick(v as DigitalScope | '')}>{l}</button>)}
    </div>
    <p role="status" className="small muted">{list.length} noticia(s)</p>
    {list.length ? <div className="stack">{list.slice(0, shown).map((n) => <DigitalNewsCard key={n.id} n={n} />)}</div> : <Empty title="Todavía no hay noticias en este ámbito." />}
    {list.length > shown && <p><button type="button" className="btn" onClick={() => setShown(shown + FEED_STEP)}>Mostrar más</button></p>}
    <p className="small muted">Cada noticia enlaza a su fuente original. Resúmenes elaborados con asistencia de IA y revisados editorialmente.</p>
  </section>;
}

export function EduGrid() {
  return <section className="da-edu" aria-labelledby="da-edu-h">
    <h2 id="da-edu-h">Aprende sobre activos digitales</h2>
    <p className="edu-note" role="note">{EDU_DISCLAIMER} Contenido propio con fuentes citadas al final de cada pieza.</p>
    <div className="da-edu-grid">{eduPieces.map((e) => <article key={e.id} className="card da-edu-card">
      <div className="meta"><span className="badge badge-educativo">Educativo</span></div>
      <h3><Link to={`/activos-digitales/${e.id}`}>{e.title}</Link></h3>
      <p>{e.summary}</p>
      <p className="small"><Link to={`/activos-digitales/${e.id}`}>Leer la guía →</Link></p>
    </article>)}</div>
    <p className="small"><Link to="/glosario">Ver el glosario completo →</Link></p>
  </section>;
}

export function ActivosDigitales() {
  useSeo('Activos digitales', 'Noticias diarias de activos digitales, stablecoins y su relación con la banca de Panamá y del mundo, más guías educativas sobre blockchain, P2P, wallets y seguridad.');
  return <>
    <PageHeader title="Activos digitales" intro="Noticias sobre el sistema de activos digitales y su relación con la banca nacional e internacional, y un portal educativo para entender blockchain, P2P, wallets, stablecoins y más." />
    <div className="da-layout"><DigitalNewsFeed /><EduGrid /></div>
    <p className="small muted">{EDU_DISCLAIMER} Nada en esta página es una oferta ni una recomendación de compra o venta. Consulta con un asesor y con las fuentes oficiales.</p>
  </>;
}

export function ActivoDigitalPage({ slug }: { slug?: string }) {
  const i = eduPieces.findIndex((x) => x.id === slug);
  const e = eduPieces[i];
  useSeo(e ? `${e.title} | Activos digitales` : 'Guía no encontrada', e?.summary ?? 'La guía solicitada no existe.');
  if (!e) return <div className="notfound"><p className="code">404</p><h1>Guía no encontrada</h1><p><Link className="btn" to="/activos-digitales">Volver a Activos digitales</Link></p></div>;
  const prev = eduPieces[i - 1], next = eduPieces[i + 1];
  return <article className="prose da-article">
    <p className="crumbs"><Link to="/activos-digitales">Activos digitales</Link> › {e.title}</p>
    <div className="meta"><span className="badge badge-educativo">Educativo</span>{e.aiAssisted && <span className="ai-label">Asistido por IA</span>}</div>
    <h1>{e.title}</h1>
    <p className="lead">{e.summary}</p>
    <p className="edu-note" role="note">{EDU_DISCLAIMER}</p>
    {e.sections.map((s) => <section key={s.h}><h2>{s.h}</h2>{s.p?.map((t, k) => <p key={k}>{t}</p>)}{s.ul && <ul>{s.ul.map((t, k) => <li key={k}>{t}</li>)}</ul>}</section>)}
    {e.id === 'glosario-rapido-activos-digitales' && <p><Link className="btn" to="/glosario">Abrir el glosario completo</Link></p>}
    {e.sources.length > 0 && <section><h2>Fuentes</h2><ul>{e.sources.filter((s) => s.url.startsWith('https://')).map((s) => <li key={s.url}><a href={s.url} target="_blank" rel="noopener noreferrer">{s.name}</a></li>)}</ul></section>}
    <p className="small muted">Actualizado el {formatDate(e.date)}. {e.aiAssisted && <>{AI_LABEL}. </>}{EDU_DISCLAIMER} Consulta con un asesor y con fuentes oficiales antes de tomar decisiones.</p>
    <nav className="da-pager" aria-label="Otras guías">{prev ? <Link to={`/activos-digitales/${prev.id}`}>← {prev.title}</Link> : <span />}{next ? <Link to={`/activos-digitales/${next.id}`}>{next.title} →</Link> : <span />}</nav>
    <NewsletterForm variant="compact" heading="h2" />
  </article>;
}

export function DigitalHomeBlock() {
  const top = newsDigital.slice(0, 3);
  return <section className="card da-home" aria-labelledby="dah-h">
    <p className="kicker-nl">Nuevo</p>
    <h2 id="dah-h">Activos digitales</h2>
    <p>Noticias de activos digitales y su relación con la banca de Panamá y del mundo, más guías para entender blockchain, P2P, wallets y stablecoins.</p>
    {top.length > 0 && <ul className="headlines">{top.map((n) => <li key={n.id}><a href={n.url} target="_blank" rel="noopener noreferrer">{n.title}</a><span className="source"> {n.source} · {formatDate(n.date)}</span></li>)}</ul>}
    <p><Link to="/activos-digitales" className="btn">Ir a Activos digitales</Link> <Link to="/activos-digitales/blockchain-cadena-de-bloques">¿Qué es blockchain?</Link></p>
  </section>;
}
