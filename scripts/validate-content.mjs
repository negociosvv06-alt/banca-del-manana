// Valida el contenido editorial antes de compilar. Falla si falta fuente, fecha o hay URL no https.
import { readFileSync, readdirSync } from 'node:fs';
export const loadArticles = () => readdirSync('content/articles').filter((f) => f.endsWith('.json')).map((f) => ({ f, ...JSON.parse(readFileSync('content/articles/' + f, 'utf8')) }));
const j = (p) => JSON.parse(readFileSync(p, 'utf8'));
const errs = [];
const TYPES = ['noticia', 'analisis', 'opinion', 'educativo', 'patrocinado'];
const digital = j('src/data/news-digital.json');
const news = [...j('src/data/news-panama.json'), ...j('src/data/news-intl.json').items, ...digital];
const ids = new Set();
for (const n of news) {
  if (ids.has(n.id)) errs.push(`id duplicado ${n.id}`); ids.add(n.id);
  if (!/^https:\/\//.test(n.url)) errs.push(`${n.id}: url no https`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(n.date) || n.date > new Date().toISOString().slice(0, 10)) errs.push(`${n.id}: fecha inválida o futura`);
  if (!n.title || !n.source) errs.push(`${n.id}: falta título o fuente`);
  if (!TYPES.includes(n.type)) errs.push(`${n.id}: tipo inválido`);
}
for (const n of digital) {
  if (n.category !== 'activos-digitales') errs.push(`${n.id}: category debe ser 'activos-digitales'`);
  if (!n.summary || !n.url) errs.push(`${n.id}: falta resumen o url`);
  if (!Array.isArray(n.tags) || !Array.isArray(n.banks)) errs.push(`${n.id}: tags y banks deben ser arreglos`);
}
const eduIds = new Set();
for (const e of j('src/data/education-digital.json')) {
  const w = (m) => errs.push(`educación ${e.id}: ${m}`);
  if (!/^[a-z0-9-]+$/.test(e.id ?? '')) w('slug inválido');
  if (eduIds.has(e.id)) w('slug duplicado'); eduIds.add(e.id);
  if (!e.title || !e.summary || !Array.isArray(e.sections) || !e.sections.length) w('falta title, summary o sections');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(e.date ?? '')) w('date inválida');
  if (typeof e.aiAssisted !== 'boolean') w('aiAssisted debe ser true o false');
  if (!e.sources?.length) w('sin fuentes');
  for (const s of e.sources ?? []) if (!s.url?.startsWith('https://')) w('fuente sin url https');
}
for (const i of j('src/data/indicators.json').items) if (!i.url?.startsWith('https://') || !i.published || !i.unit) errs.push(`indicador ${i.label}: falta fuente/fecha/unidad`);
const SECTIONS = ['inversiones', 'pagos', 'fintech', 'educacion', 'avanzadas', 'opinion'];
const aids = new Set();
for (const a of loadArticles()) {
  const w = (m) => errs.push(`content/articles/${a.f}: ${m}`);
  if (!/^[a-z0-9-]+$/.test(a.id ?? '')) w('id debe ser minúsculas, números y guiones');
  if (aids.has(a.id)) w('id duplicado'); aids.add(a.id);
  if (!TYPES.includes(a.type)) w('type inválido');
  if (!SECTIONS.includes(a.section)) w('section inválida: ' + SECTIONS.join(', '));
  if (!a.title || !Array.isArray(a.body) || !a.body.length) w('falta title o body');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(a.date ?? '')) w('date inválida (AAAA-MM-DD)');
  if (typeof a.aiAssisted !== 'boolean') w('aiAssisted debe ser true o false');
  for (const s of a.sources ?? []) if (!s.url?.startsWith('https://')) w('fuente sin url https');
}
if (process.argv[1]?.endsWith('validate-content.mjs') && errs.length) { console.error(errs.join('\n')); process.exit(1); }
console.log(`Contenido válido: ${news.length} noticias (${digital.length} de activos digitales), ${eduIds.size} guías educativas.`);
