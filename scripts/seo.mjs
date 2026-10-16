// Metadatos SEO por ruta (título, descripción, JSON-LD) y manifiesto de rutas válidas.
// Lo consume scripts/postbuild.mjs; el Worker (worker/index.js) los lee de dist/ para reescribir el HTML.
export const SITE_NAME = 'Banca del Mañana';
export const MAX_DESC = 155;

/** Quita markdown ligero y espacios sobrantes. */
export function plain(s) {
  return String(s ?? '').replace(/^#{1,6}\s+/, '').replace(/\[([^\]]+)\]\([^)]*\)/g, '$1').replace(/[*_`]+/g, '').replace(/\s+/g, ' ').trim();
}
/** Recorta a `max` caracteres en límite de palabra, con «…» si hubo corte. */
export function clip(s, max = MAX_DESC) {
  const t = plain(s);
  if (t.length <= max) return t;
  const cut = t.slice(0, max - 1);
  const sp = cut.lastIndexOf(' ');
  return (sp > max * 0.6 ? cut.slice(0, sp) : cut).replace(/[\s,;:.\-–—(]+$/, '') + '…';
}
/** Descripción real de un artículo: primer(os) párrafo(s) del cuerpo, sin encabezados. */
export function articleDescription(body) {
  let out = '';
  for (const p of body) {
    if (p.startsWith('## ')) continue;
    out = out ? `${out} ${plain(p)}` : plain(p);
    if (out.length >= 110) break;
  }
  return clip(out);
}
const pageTitle = (t) => `${t} | ${SITE_NAME}`;

export const HOME = { title: `${SITE_NAME} – Banca, finanzas e innovación en Panamá`, description: 'Noticias verificadas de la banca en Panamá y el mundo, calculadoras financieras, banca digital, pagos y educación financiera.' };

/** Páginas estáticas. Los textos reflejan el contenido real de cada página (hay una prueba que vigila que no se desvíen). */
export const STATIC_PAGES = {
  'banca-panama': { name: 'Banca en Panamá', description: 'Regulación de la SBP, sistema bancario, bancos, crédito, pagos y ciberseguridad. Cada noticia enlaza a su fuente original.' },
  internacional: { name: 'Noticias internacionales', description: 'Comunicados oficiales de la Reserva Federal, el BIS y el BCE tomados de sus RSS públicos. Títulos en el idioma original.' },
  'activos-digitales': { name: 'Activos digitales', description: 'Noticias diarias de activos digitales, stablecoins y su relación con la banca de Panamá y del mundo, más guías educativas sobre blockchain y P2P.' },
  calculadoras: { name: 'Calculadoras financieras', description: 'Calculadoras de préstamos, ahorro, plazo fijo, deudas, inflación, VPN/TIR y divisas. Los cálculos se hacen en tu navegador.' },
  inversiones: { name: 'Inversiones', description: 'Conceptos para invertir con criterio: perfil de riesgo, interés compuesto, renta fija y variable. Sin cotizaciones simuladas.' },
  'medios-de-pago': { name: 'Medios de pago', description: 'Yappy, ACH, tarjetas, billeteras y pagos instantáneos en Panamá.' },
  fintech: { name: 'Banca digital y fintech', description: 'Inteligencia artificial, ciberseguridad, fraude e innovación en servicios financieros.' },
  educacion: { name: 'Ahorro y educación financiera', description: 'Guías prácticas para ahorrar, endeudarse con responsabilidad y protegerse del fraude.' },
  'finanzas-avanzadas': { name: 'Finanzas avanzadas', description: 'Valoración, renta fija, VPN, TIR y gestión de riesgos.' },
  opinion: { name: 'Opinión y análisis', description: 'Análisis y columnas, siempre identificados y separados de las noticias.' },
  glosario: { name: 'Glosario financiero', description: 'Términos bancarios, financieros y de activos digitales explicados en lenguaje claro, con conceptos de Panamá como Yappy, ACH y Telered.' },
  buscar: { name: 'Buscar', description: 'Búsqueda global en noticias, artículos, guías de activos digitales y glosario de Banca del Mañana.', noindex: true },
  fuentes: { name: 'Fuentes e integraciones', description: 'Estado real de cada fuente: RSS y API consultados automáticamente o curación manual con enlace y fecha.' },
  acerca: { name: 'Acerca de Banca del Mañana', description: 'Plataforma de información y educación financiera sobre la banca de Panamá, pagos, banca digital e inversiones. No somos un banco ni una entidad regulada.' },
  metodologia: { name: 'Metodología editorial', description: 'Cómo publicamos: fuente pública verificable, enlace y fecha en cada noticia, etiquetas editoriales y sin datos simulados.' },
  contacto: { name: 'Contacto', description: 'Escríbenos para sugerencias, correcciones o propuestas editoriales.' },
  privacidad: { name: 'Política de privacidad', description: 'Sin cookies de seguimiento ni publicidad. Las calculadoras funcionan en tu navegador y el boletín se gestiona con MailerLite.' },
  terminos: { name: 'Términos de uso', description: 'El contenido es informativo y educativo y puede citarse con enlace a la fuente. Condiciones de uso de Banca del Mañana.' },
  'aviso-legal': { name: 'Aviso financiero', description: 'Nada en este sitio constituye asesoría financiera, legal o tributaria ni una oferta o recomendación de compra o venta de valores.' },
};

/** Sección de artículo (campo `section`) → ruta y nombre. */
export const ARTICLE_SECTIONS = {
  opinion: ['opinion', 'Opinión y análisis'], inversiones: ['inversiones', 'Inversiones'], pagos: ['medios-de-pago', 'Medios de pago'],
  fintech: ['fintech', 'Banca digital y fintech'], educacion: ['educacion', 'Ahorro y educación financiera'], avanzadas: ['finanzas-avanzadas', 'Finanzas avanzadas'],
};

/** Extrae {id,title,desc} del arreglo CALCS de src/pages/Calculators.tsx (así el SEO nunca se desvía del texto real). */
export function parseCalcs(src) {
  const out = [];
  for (const m of src.matchAll(/\{ id: '([\w-]+)', title: '((?:[^'\\]|\\.)*)', desc: '((?:[^'\\]|\\.)*)', C:/g)) out.push({ id: m[1], title: m[2].replace(/\\'/g, "'"), desc: m[3].replace(/\\'/g, "'") });
  return out;
}

/**
 * Construye el índice de metadatos. Devuelve { records, routes } donde records es un Map ruta → meta.
 * meta: { t, d, type: 'website'|'article', pub?, noindex?, ld: [objetos JSON-LD] }
 */
export function buildMeta({ site, articles, guides, calcs }) {
  const abs = (p) => `${site}${p}`;
  const org = { '@type': 'NewsMediaOrganization', name: SITE_NAME, url: abs('/'), logo: abs('/favicon.svg') };
  const crumbs = (items) => ({ '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: items.map(([name, path], i) => ({ '@type': 'ListItem', position: i + 1, name, item: abs(path) })) });
  const home = ['Inicio', '/'];
  const records = new Map();
  const add = (path, rec) => records.set(path, { type: 'website', ld: [], ...rec });

  add('/', { t: HOME.title, d: HOME.description, ld: [{ '@context': 'https://schema.org', '@type': 'WebSite', name: SITE_NAME, url: abs('/'), inLanguage: 'es', publisher: org, potentialAction: { '@type': 'SearchAction', target: { '@type': 'EntryPoint', urlTemplate: `${abs('/buscar')}?q={search_term_string}` }, 'query-input': 'required name=search_term_string' } }] });
  for (const [slug, p] of Object.entries(STATIC_PAGES)) {
    const path = `/${slug}`;
    add(path, { t: pageTitle(p.name), d: clip(p.description), noindex: !!p.noindex, ld: [crumbs([home, [p.name, path]])] });
  }
  for (const c of calcs) {
    const path = `/calculadoras/${c.id}`;
    add(path, { t: pageTitle(c.title), d: clip(c.desc), ld: [crumbs([home, ['Calculadoras financieras', '/calculadoras'], [c.title, path]])] });
  }
  for (const g of guides) {
    const path = `/activos-digitales/${g.id}`;
    const t = `${g.title} | Activos digitales`;
    add(path, { t: pageTitle(t), d: clip(g.summary), type: 'article', pub: g.date, ld: [
      { '@context': 'https://schema.org', '@type': 'Article', headline: g.title, description: clip(g.summary), datePublished: g.date, dateModified: g.date, inLanguage: 'es', url: abs(path), mainEntityOfPage: abs(path), image: abs('/og.png'), articleSection: 'Activos digitales', author: { '@type': 'Organization', name: SITE_NAME, url: abs('/') }, publisher: org, ...(g.sources?.length ? { citation: g.sources.filter((s) => s.url?.startsWith('https://')).map((s) => ({ '@type': 'CreativeWork', name: s.name, url: s.url })) } : {}) },
      crumbs([home, ['Activos digitales', '/activos-digitales'], [g.title, path]]),
    ] });
  }
  for (const a of articles) {
    const path = `/articulo/${a.id}`;
    const sec = ARTICLE_SECTIONS[a.section];
    if (!sec) throw new Error(`Sección de artículo desconocida: ${a.section} (${a.id})`);
    const d = articleDescription(a.body);
    add(path, { t: pageTitle(a.title), d, type: 'article', pub: a.date, ld: [
      { '@context': 'https://schema.org', '@type': a.type === 'opinion' ? 'OpinionNewsArticle' : 'NewsArticle', headline: a.title, description: d, datePublished: a.date, dateModified: a.date, inLanguage: 'es', url: abs(path), mainEntityOfPage: abs(path), image: abs('/og.png'), articleSection: sec[1], author: { '@type': 'Organization', name: SITE_NAME, url: abs('/') }, publisher: org, ...(a.sources?.length ? { citation: a.sources.filter((s) => s.url?.startsWith('https://')).map((s) => ({ '@type': 'CreativeWork', name: s.name, url: s.url })) } : {}) },
      crumbs([home, [sec[1], `/${sec[0]}`], [a.title, path]]),
    ] });
  }
  return records;
}
