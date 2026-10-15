// Fusión de noticias internacionales: conserva los ítems manuales y reemplaza los de RSS por los recién obtenidos.
export const RSS_PREFIXES = ['fed-', 'ecb-', 'bis-'];
/** Un ítem es manual si lo marca `manual: true` o si su id no tiene prefijo de RSS (fed-/ecb-/bis-) y no es un ítem RSS antiguo. */
export const isManual = (n) => n?.manual === true || !RSS_PREFIXES.some((p) => String(n?.id ?? '').startsWith(p));

/** Devuelve ítems manuales previos + ítems RSS nuevos, sin duplicar por id ni url (gana el manual), por fecha descendente. */
export function mergeIntl(prevItems, rssItems) {
  const manual = (prevItems ?? []).filter(isManual).map((n) => ({ ...n, manual: true }));
  const ids = new Set(manual.map((n) => n.id));
  const urls = new Set(manual.map((n) => n.url));
  const out = [...manual];
  for (const n of rssItems ?? []) {
    if (ids.has(n.id) || urls.has(n.url)) continue;
    ids.add(n.id); urls.add(n.url); out.push(n);
  }
  // Nunca se publican ítems marcados stale (fuente caída).
  return out.filter((n) => !n.stale).map(({ stale, staleNote, ...n }) => n).sort((a, b) => b.date.localeCompare(a.date) || a.id.localeCompare(b.id));
}
