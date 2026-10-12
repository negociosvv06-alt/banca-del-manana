// Valida el contenido editorial antes de compilar. Falla si falta fuente, fecha o hay URL no https.
import { readFileSync } from 'node:fs';
const j = (p) => JSON.parse(readFileSync(p, 'utf8'));
const errs = [];
const TYPES = ['noticia', 'analisis', 'opinion', 'educativo', 'patrocinado'];
const news = [...j('src/data/news-panama.json'), ...j('src/data/news-intl.json').items];
const ids = new Set();
for (const n of news) {
  if (ids.has(n.id)) errs.push(`id duplicado ${n.id}`); ids.add(n.id);
  if (!/^https:\/\//.test(n.url)) errs.push(`${n.id}: url no https`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(n.date) || n.date > new Date().toISOString().slice(0, 10)) errs.push(`${n.id}: fecha inválida o futura`);
  if (!n.title || !n.source) errs.push(`${n.id}: falta título o fuente`);
  if (!TYPES.includes(n.type)) errs.push(`${n.id}: tipo inválido`);
}
for (const i of j('src/data/indicators.json').items) if (!i.url?.startsWith('https://') || !i.published || !i.unit) errs.push(`indicador ${i.label}: falta fuente/fecha/unidad`);
for (const a of j('src/data/articles.json')) if (!TYPES.includes(a.type)) errs.push(`artículo ${a.id}: tipo inválido`);
if (errs.length) { console.error(errs.join('\n')); process.exit(1); }
console.log(`Contenido válido: ${news.length} noticias.`);
