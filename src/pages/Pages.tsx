import { useMemo, useState, type FormEvent, type ReactNode } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { AI_LABEL, allNews, newsPanama, newsPanamaArchive, newsIntl, articles, banks, glossary, indicators, searchNews, searchSite, formatDate, CATEGORY_LABEL, TYPE_LABEL, type Article } from '../lib/content';
import { Badge, Empty, NewsCard, PageHeader, Paginated, useSeo } from '../components/ui';
import { CALCS } from './Calculators';
import NewsletterForm from '../components/NewsletterForm';
import { DigitalHomeBlock } from './DigitalAssets';
import SOURCES from '../data/sources.json';

function Indicators() {
  return <section aria-labelledby="ind-h"><h2 id="ind-h">Indicadores del sistema bancario</h2>
    <div className="grid ind-grid">{indicators.items.map((i) => <div key={i.label} className="card indicator"><p className="ind-label">{i.label}</p><p className="ind-value">{i.value} <span>{i.unit}</span></p>{i.change && <p className="ind-change">{i.change}</p>}<p className="source">Periodo: {i.period} · <a href={i.url} target="_blank" rel="noopener noreferrer">{i.source}</a> ({formatDate(i.published)})</p></div>)}</div>
    <p className="small muted">Datos ingresados manualmente desde publicaciones oficiales; no se actualizan en tiempo real.</p></section>;
}
function MostRead() {
  return <section className="card" aria-labelledby="mr-h"><h2 id="mr-h">Más leídas</h2><Empty title="Aún no hay datos de lectura.">Este bloque se calculará solo con analítica real del sitio (por ejemplo, Cloudflare Web Analytics). No mostramos rankings inventados.</Empty></section>;
}
function ArticleCard({ a }: { a: Article }) {
  return <article className="card"><div className="meta"><Badge type={a.type} />{a.aiAssisted && <span className="ai-label">Asistido por IA</span>}</div><h3><Link to={`/articulo/${a.id}`}>{a.title}</Link></h3><p>{a.body[0]}</p><p className="source">{a.author ?? 'Equipo editorial'} · {formatDate(a.date)}</p></article>;
}

export function Home() {
  useSeo('', 'Noticias verificadas de la banca en Panamá y el mundo, calculadoras financieras, banca digital, pagos y educación financiera.');
  const [lead, ...rest] = newsPanama.length ? newsPanama : newsPanamaArchive.slice(0, 1);
  const trends = allNews.filter((n) => ['tecnologia', 'ciberseguridad', 'pagos'].includes(n.category)).slice(0, 3);
  return <>
    <section className="hero">
      <div className="hero-main card"><p className="kicker">Titular · Banca en Panamá</p><div className="meta"><Badge type={lead.type} /></div><h1><a href={lead.url} target="_blank" rel="noopener noreferrer">{lead.title}</a></h1><p className="lead">{lead.summary}</p><p className="source">Fuente: {lead.source} · {formatDate(lead.date)}</p></div>
      <div className="hero-side"><h2>Últimas verificadas</h2><ul className="headlines">{rest.slice(0, 5).map((n) => <li key={n.id}><a href={n.url} target="_blank" rel="noopener noreferrer">{n.title}</a><span className="source"> {n.source} · {formatDate(n.date)}</span></li>)}</ul><Link to="/banca-panama" className="btn">Todas las noticias de Panamá</Link></div>
    </section>
    <DigitalHomeBlock />
    <Indicators />
    <section aria-labelledby="calc-h"><h2 id="calc-h">Calculadoras destacadas</h2><div className="grid four">{CALCS.filter((c) => ['ahorro', 'prestamo', 'plazo-fijo', 'meta'].includes(c.id)).map((c) => <Link key={c.id} className="card tool" to={`/calculadoras/${c.id}`}><h3>{c.title}</h3><p>{c.desc}</p></Link>)}</div></section>
    <div className="two-col">
      <section aria-labelledby="pa-h"><h2 id="pa-h">Panamá</h2><div className="stack">{rest.slice(5, 9).map((n) => <NewsCard key={n.id} n={n} />)}</div><Link to="/banca-panama">Más de Panamá →</Link></section>
      <section aria-labelledby="int-h"><h2 id="int-h">Internacional</h2><div className="stack">{newsIntl.slice(0, 4).map((n) => <NewsCard key={n.id} n={n} />)}</div><Link to="/internacional">Más internacional →</Link></section>
    </div>
    <section aria-labelledby="tr-h"><h2 id="tr-h">Tendencias: banca digital, IA y ciberseguridad</h2><div className="grid">{trends.map((n) => <NewsCard key={n.id} n={n} />)}</div></section>
    <div className="two-col"><section aria-labelledby="an-h"><h2 id="an-h">Análisis y educación</h2><div className="stack">{articles.filter((a) => ['analisis', 'educativo'].includes(a.type)).slice(0, 3).map((a) => <ArticleCard key={a.id} a={a} />)}</div></section><MostRead /></div>
    <NewsletterForm />
  </>;
}

function NewsBrowser({ items, title, intro }: { items: typeof allNews; title: string; intro: string }) {
  const [sp, setSp] = useSearchParams();
  const f = { q: sp.get('q') ?? '', category: sp.get('cat') ?? '', bank: sp.get('banco') ?? '', country: sp.get('pais') ?? '', from: sp.get('desde') ?? '', to: sp.get('hasta') ?? '', type: sp.get('tipo') ?? '' };
  const results = useMemo(() => searchNews(items, f), [items, sp]); // eslint-disable-line
  const upd = (k: string, v: string) => { const n = new URLSearchParams(sp); if (v) n.set(k, v); else n.delete(k); n.delete('p'); setSp(n, { replace: true }); };
  const cats = [...new Set(items.map((n) => n.category))], countries = [...new Set(items.map((n) => n.country))];
  useSeo(title, intro);
  return <><PageHeader title={title} intro={intro} />
    <form className="filters card" role="search" onSubmit={(e) => e.preventDefault()} aria-label="Filtros de noticias">
      <div className="field"><label htmlFor="f-q">Buscar</label><input id="f-q" type="search" value={f.q} maxLength={100} onChange={(e) => upd('q', e.target.value)} /></div>
      <div className="field"><label htmlFor="f-c">Categoría</label><select id="f-c" value={f.category} onChange={(e) => upd('cat', e.target.value)}><option value="">Todas</option>{cats.map((c) => <option key={c} value={c}>{CATEGORY_LABEL[c] ?? c}</option>)}</select></div>
      <div className="field"><label htmlFor="f-b">Banco</label><select id="f-b" value={f.bank} onChange={(e) => upd('banco', e.target.value)}><option value="">Todos</option>{banks.items.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}</select></div>
      <div className="field"><label htmlFor="f-p">País/región</label><select id="f-p" value={f.country} onChange={(e) => upd('pais', e.target.value)}><option value="">Todos</option>{countries.map((c) => <option key={c}>{c}</option>)}</select></div>
      <div className="field"><label htmlFor="f-t">Tipo</label><select id="f-t" value={f.type} onChange={(e) => upd('tipo', e.target.value)}><option value="">Todos</option>{Object.entries(TYPE_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></div>
      <div className="field"><label htmlFor="f-d">Desde</label><input id="f-d" type="date" value={f.from} onChange={(e) => upd('desde', e.target.value)} /></div>
      <div className="field"><label htmlFor="f-h">Hasta</label><input id="f-h" type="date" value={f.to} onChange={(e) => upd('hasta', e.target.value)} /></div>
    </form>
    <p role="status" className="muted">{results.length} resultado(s)</p>
    {results.length ? <Paginated items={results} perPage={9} label="noticias" render={(n) => <NewsCard key={n.id} n={n} />} /> : <Empty title="No hay noticias con esos filtros.">Pruebe quitar algún filtro.</Empty>}</>;
}
export const BancaPanama = () => <><NewsBrowser items={newsPanama} title="Banca en Panamá" intro="Regulación de la SBP, sistema bancario, bancos, crédito, pagos y ciberseguridad. Cada noticia enlaza a su fuente original." /><Indicators /></>;
export function Internacional() {
  return <><NewsBrowser items={newsIntl} title="Noticias internacionales" intro="Comunicados oficiales de bancos centrales y organismos internacionales (Reserva Federal, Banco de Pagos Internacionales y Banco Central Europeo), obtenidos de sus RSS públicos. Títulos en el idioma original (inglés)." /></>;
}

const SECTIONS: Record<string, { title: string; intro: string; cats: string[]; extra?: ReactNode }> = {
  inversiones: { title: 'Inversiones', intro: 'Conceptos para invertir con criterio: perfil de riesgo, interés compuesto, renta fija y variable. Sin cotizaciones simuladas.', cats: ['economia'], extra: <p className="warn">No publicamos cotizaciones en tiempo real: requieren un proveedor de datos con licencia. Consulte a un intermediario autorizado por la SMV.</p> },
  'medios-de-pago': { title: 'Medios de pago', intro: 'Yappy, ACH, tarjetas, billeteras y pagos instantáneos en Panamá.', cats: ['pagos'] },
  fintech: { title: 'Banca digital y fintech', intro: 'Inteligencia artificial, ciberseguridad, fraude e innovación en servicios financieros.', cats: ['tecnologia', 'ciberseguridad'] },
  educacion: { title: 'Ahorro y educación financiera', intro: 'Guías prácticas para ahorrar, endeudarse con responsabilidad y protegerse del fraude.', cats: ['credito'] },
  'finanzas-avanzadas': { title: 'Finanzas avanzadas', intro: 'Valoración, renta fija, VPN, TIR y gestión de riesgos.', cats: [] },
  opinion: { title: 'Opinión y análisis', intro: 'Análisis y columnas, siempre identificados y separados de las noticias.', cats: [] },
};
const SECTION_ARTICLES: Record<string, string> = { inversiones: 'inversiones', 'medios-de-pago': 'pagos', fintech: 'fintech', educacion: 'educacion', 'finanzas-avanzadas': 'avanzadas', opinion: 'opinion' };
export function Section({ slug }: { slug: string }) {
  const s = SECTIONS[slug];
  useSeo(s.title, s.intro);
  const arts = articles.filter((a) => a.section === SECTION_ARTICLES[slug]);
  const news = allNews.filter((n) => s.cats.includes(n.category));
  return <><PageHeader title={s.title} intro={s.intro} />{s.extra}
    {arts.length > 0 && <section><h2>Artículos</h2><div className="grid">{arts.map((a) => <ArticleCard key={a.id} a={a} />)}</div></section>}
    {news.length > 0 && <section><h2>Noticias relacionadas</h2><Paginated items={news} perPage={6} label="noticias" render={(n) => <NewsCard key={n.id} n={n} />} /></section>}
    {!arts.length && !news.length && <Empty title="Todavía no hay publicaciones en esta sección." />}
    <p><Link to="/calculadoras">Ir a las calculadoras →</Link></p></>;
}
export function ArticlePage({ id }: { id?: string }) {
  const a = articles.find((x) => x.id === id);
  useSeo(a?.title ?? 'Artículo no encontrado', a?.body[0] ?? '');
  if (!a) return <NotFound />;
  return <article className="prose"><div className="meta"><Badge type={a.type} /></div><h1>{a.title}</h1><p className="source">{a.author ?? 'Equipo editorial'} · {formatDate(a.date)}</p>{a.aiAssisted && <p className="ai-label" role="note">{AI_LABEL}</p>}{a.body.map((p, i) => <p key={i}>{p}</p>)}{a.sources?.length ? <><h2>Fuentes</h2><ul>{a.sources.filter((s) => s.url.startsWith('https://')).map((s) => <li key={s.url}><a href={s.url} target="_blank" rel="noopener noreferrer">{s.name}</a>{s.date && ` (${formatDate(s.date)})`}</li>)}</ul></> : null}
    {a.type === 'opinion' && <p className="small muted">Las opiniones son responsabilidad de su autor.</p>}<p className="small muted">Contenido informativo; no constituye asesoría financiera.</p><NewsletterForm variant="compact" heading="h2" /></article>;
}

export function Glosario() {
  useSeo('Glosario financiero', 'Definiciones claras de términos bancarios y financieros.');
  const [q, setQ] = useState('');
  const list = glossary.filter((g) => (g.term + g.def).toLowerCase().includes(q.toLowerCase())).sort((a, b) => a.term.localeCompare(b.term, 'es'));
  return <><PageHeader title="Glosario financiero" intro={`${glossary.length} términos explicados en lenguaje claro.`} />
    <div className="field"><label htmlFor="g-q">Buscar término</label><input id="g-q" type="search" value={q} onChange={(e) => setQ(e.target.value)} maxLength={60} /></div>
    {list.length ? <dl className="glossary">{list.map((g) => <div key={g.term}><dt id={g.term}>{g.term}</dt><dd>{g.def}</dd></div>)}</dl> : <Empty title="Sin coincidencias." />}</>;
}

export function Buscar() {
  const [sp, setSp] = useSearchParams();
  const q = sp.get('q') ?? '';
  const r = useMemo(() => searchSite(q), [q]);
  useSeo('Buscar', 'Búsqueda global en Banca del Mañana.');
  const total = r.news.length + r.articles.length + r.glossary.length + r.digital.length;
  return <><PageHeader title="Buscar" />
    <form role="search" onSubmit={(e) => { e.preventDefault(); setSp({ q: String(new FormData(e.currentTarget).get('q') ?? '').slice(0, 100) }); }} className="search-big"><label htmlFor="s-q" className="sr-only">Término</label><input id="s-q" name="q" type="search" defaultValue={q} key={q} maxLength={100} /><button className="btn">Buscar</button></form>
    {!q ? <Empty title="Escriba un término para buscar en noticias, artículos, guías de activos digitales y glosario." /> : total === 0 ? <Empty title={`No hay resultados para “${q}”.`}>Revise la ortografía o use términos más generales.</Empty> : <>
      <p role="status">{total} resultado(s) para “{q}”</p>
      {r.news.length > 0 && <section><h2>Noticias ({r.news.length})</h2><Paginated items={r.news} perPage={6} label="resultados" render={(n) => <NewsCard key={n.id} n={n} />} /></section>}
      {r.articles.length > 0 && <section><h2>Artículos</h2><div className="grid">{r.articles.map((a) => <ArticleCard key={a.id} a={a} />)}</div></section>}
      {r.digital.length > 0 && <section><h2>Guías de activos digitales</h2><ul>{r.digital.map((e) => <li key={e.id}><Link to={`/activos-digitales/${e.id}`}>{e.title}</Link></li>)}</ul></section>}
      {r.glossary.length > 0 && <section><h2>Glosario</h2><dl className="glossary">{r.glossary.map((g) => <div key={g.term}><dt>{g.term}</dt><dd>{g.def}</dd></div>)}</dl></section>}</>}</>;
}

export function Fuentes() {
  useSeo('Fuentes e integraciones', 'Fuentes oficiales y estado de cada integración.');
  return <><PageHeader title="Fuentes e integraciones" intro="Estado real de cada fuente. 'RSS' y 'API' se consultan automáticamente; 'Manual' significa curación editorial con enlace y fecha." />
    <div className="table-wrap"><table><thead><tr><th>Fuente</th><th>Tipo</th><th>Estado</th><th>Nota</th></tr></thead><tbody>{(SOURCES as { id: string; name: string; type: string; url: string; note?: string }[]).map((s) => { return <tr key={s.id}><td><a href={s.url} target="_blank" rel="noopener noreferrer">{s.name}</a></td><td>{s.type.toUpperCase()}</td><td>{s.type === 'rss' ? 'Automática (RSS oficial)' : s.type === 'api' ? 'Consulta en vivo desde el navegador' : 'Manual'}</td><td>{s.note ?? ''}</td></tr>; })}</tbody></table></div>
    <p>Además, las noticias de Panamá provienen de medios y entidades citados en cada tarjeta (SBP, Ministerio Público, La Prensa, La Estrella, TVN, Telemetro, Nexo, Panamá Banking News, entre otros).</p></>;
}

const Static = ({ title, children }: { title: string; children: ReactNode }) => { useSeo(title, title); return <div className="prose"><h1>{title}</h1>{children}</div>; };
export const Acerca = () => <Static title="Acerca de Banca del Mañana"><p>Banca del Mañana es una plataforma de información y educación financiera sobre el sistema bancario de Panamá, la economía internacional, los pagos, la banca digital y las inversiones. Nace como extensión del canal de YouTube del mismo nombre.</p><p>Nuestro público: ciudadanos, estudiantes, profesionales, emprendedores e inversionistas.</p><p>Independencia: no somos un banco ni una entidad regulada. No recibimos depósitos ni ofrecemos productos financieros. El contenido patrocinado se identifica siempre con la etiqueta “Patrocinado”.</p><p><Link to="/metodologia">Metodología editorial</Link> · <Link to="/contacto">Contacto</Link> · <Link to="/fuentes">Fuentes</Link></p></Static>;
export const Metodologia = () => <Static title="Metodología editorial"><ul><li>Solo publicamos noticias con fuente pública verificable, enlace y fecha de publicación.</li><li>No simulamos noticias, tasas, cotizaciones ni rendimientos. Si un dato no está verificado, no lo publicamos o lo marcamos como “Pendiente de verificación”.</li><li>Distinguimos con etiquetas: Noticia, Análisis, Opinión, Educativo y Patrocinado.</li><li>Activos digitales: las noticias enlazan a su fuente original (autoridades, organismos y medios) y las guías educativas son contenido propio con fuentes citadas; ninguna constituye asesoría de inversión.</li><li>Las noticias con más de 60 días dejan de mostrarse en las portadas y listados, pero siguen disponibles en el buscador del sitio.</li><li>Las noticias internacionales se obtienen de RSS oficiales; si una fuente no está disponible, simplemente no se publican sus ítems hasta que vuelva a responder.</li><li>Correcciones: los errores se corrigen en el repositorio público con registro de cambios. Escríbanos desde <Link to="/contacto">Contacto</Link>.</li></ul></Static>;
export const Privacidad = () => <Static title="Política de privacidad"><p>No usamos cookies de seguimiento ni publicidad. La preferencia de tema (claro/oscuro) se guarda solo en su navegador.</p><p>Las calculadoras funcionan en su navegador: los montos que ingresa no se envían a ningún servidor. El conversor de divisas consulta la API pública Frankfurter, que recibe su dirección IP como cualquier sitio web.</p><p>El formulario de contacto abre su propio programa de correo; no almacenamos los mensajes en este sitio.</p><p><strong>Boletín.</strong> Si te suscribes al boletín gratuito, tu correo se envía directamente a MailerLite, nuestro proveedor de correo electrónico, que lo almacena y envía el boletín. Solo usamos tu correo para enviarte el boletín; no lo vendemos ni lo compartimos con anunciantes. Puedes darte de baja en cualquier momento con el enlace al pie de cada boletín. No recopilamos datos de tarjetas ni de pagos. Consulta la política de privacidad de MailerLite en mailerlite.com/legal/privacy-policy.</p><p>Nunca le pediremos credenciales bancarias, números de tarjeta, PIN ni códigos de autenticación.</p><p><strong>Analítica.</strong> Usamos Cloudflare Web Analytics para conocer, de forma agregada, cuántas personas visitan el sitio, qué páginas leen, desde qué países y con qué tipo de dispositivo o navegador. Esta herramienta no usa cookies ni almacenamiento local para seguimiento, no crea perfiles ni te identifica individualmente, y no la usamos con fines publicitarios. Cloudflare procesa datos técnicos de la visita, como la dirección IP, para generar esas estadísticas. Más información en la política de privacidad de Cloudflare.</p><p>Referencia: Ley 81 de 2019 de protección de datos personales de Panamá. <em>Texto pendiente de revisión legal.</em></p></Static>;
export const Terminos = () => <Static title="Términos de uso"><p>El contenido es informativo y educativo. Puede citarse con enlace a la fuente. Las marcas mencionadas pertenecen a sus titulares y se citan solo con fines informativos.</p><p>No garantizamos la exactitud de datos de terceros; cada dato enlaza a su origen. <em>Texto pendiente de revisión legal local.</em></p></Static>;
export const AvisoLegal = () => <Static title="Aviso financiero"><p>Nada en este sitio constituye asesoría financiera, legal o tributaria, ni una oferta o recomendación de compra o venta de valores. Las calculadoras producen estimaciones con los datos que usted ingresa. Rendimientos pasados no garantizan resultados futuros. Consulte con entidades autorizadas por la Superintendencia de Bancos (SBP) o la Superintendencia del Mercado de Valores (SMV).</p></Static>;

export function Contacto() {
  useSeo('Contacto', 'Escríbanos para sugerencias, correcciones o propuestas.');
  const to = import.meta.env.VITE_CONTACT_EMAIL as string | undefined;
  const [err, setErr] = useState<Record<string, string>>({});
  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const d = Object.fromEntries(new FormData(e.currentTarget)) as Record<string, string>;
    const errs: Record<string, string> = {};
    if (!d.nombre?.trim() || d.nombre.length > 80) errs.nombre = 'Indique su nombre (máx. 80 caracteres).';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(d.email ?? '')) errs.email = 'Correo inválido.';
    if (!d.mensaje?.trim() || d.mensaje.length > 2000) errs.mensaje = 'Escriba un mensaje (máx. 2000 caracteres).';
    if (/\b\d{13,19}\b/.test(d.mensaje.replace(/[\s-]/g, ''))) errs.mensaje = 'No incluya números de tarjeta ni datos bancarios.';
    setErr(errs);
    if (Object.keys(errs).length || !to) return;
    window.location.href = `mailto:${to}?subject=${encodeURIComponent('[Banca del Mañana] ' + d.asunto)}&body=${encodeURIComponent(`${d.mensaje}\n\n— ${d.nombre} <${d.email}>`)}`;
  };
  return <><PageHeader title="Contacto" intro="Sugerencias, correcciones o propuestas editoriales." />
    <p className="warn">Nunca envíe contraseñas, números de tarjeta, PIN ni códigos de verificación.</p>
    {!to && <p className="muted" role="status">El correo de contacto aún no está configurado (variable VITE_CONTACT_EMAIL).</p>}
    <form className="card contact" onSubmit={submit} noValidate>
      {[['nombre', 'Nombre', 'text'], ['email', 'Correo electrónico', 'email']].map(([n, l, t]) => <div className="field" key={n}><label htmlFor={`c-${n}`}>{l}</label><input id={`c-${n}`} name={n} type={t} maxLength={120} aria-invalid={!!err[n]} />{err[n] && <span className="field-err">{err[n]}</span>}</div>)}
      <div className="field"><label htmlFor="c-asunto">Asunto</label><select id="c-asunto" name="asunto"><option>Corrección</option><option>Sugerencia</option><option>Prensa / alianzas</option></select></div>
      <div className="field wide"><label htmlFor="c-mensaje">Mensaje</label><textarea id="c-mensaje" name="mensaje" rows={6} maxLength={2000} aria-invalid={!!err.mensaje} />{err.mensaje && <span className="field-err">{err.mensaje}</span>}</div>
      <button className="btn" disabled={!to}>Abrir en mi correo</button>
    </form></>;
}

export function NotFound() {
  useSeo('Página no encontrada', 'La página solicitada no existe.');
  return <div className="notfound"><p className="code">404</p><h1>Página no encontrada</h1><p>La dirección no existe o fue movida.</p><p><Link className="btn" to="/">Volver al inicio</Link> <Link to="/buscar">Buscar en el sitio</Link></p></div>;
}
