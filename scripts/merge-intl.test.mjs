import { describe, it, expect } from 'vitest';
import { mergeIntl, isManual } from './merge-intl.mjs';
const it_ = (id, date, extra = {}) => ({ id, date, url: `https://x.org/${id}`, title: id, source: 's', ...extra });
describe('mergeIntl', () => {
  it('conserva manuales, descarta RSS previos y ordena por fecha desc', () => {
    const prev = [it_('fed-old', '2026-10-01'), it_('fmi-weo', '2026-10-13'), it_('bce-x', '2026-10-14', { manual: true })];
    const rss = [it_('fed-new', '2026-10-10'), it_('bis-new', '2026-10-15')];
    const r = mergeIntl(prev, rss);
    expect(r.map((n) => n.id)).toEqual(['bis-new', 'bce-x', 'fmi-weo', 'fed-new']);
    expect(r.find((n) => n.id === 'fmi-weo').manual).toBe(true);
    expect(r.some((n) => n.id === 'fed-old')).toBe(false);
  });
  it('no duplica por id ni url (gana el manual)', () => {
    const prev = [it_('fmi-weo', '2026-10-13')];
    const rss = [it_('fed-a', '2026-10-12', { url: 'https://x.org/fmi-weo' }), it_('fed-b', '2026-10-12'), it_('fed-b', '2026-10-12')];
    const r = mergeIntl(prev, rss);
    expect(r.map((n) => n.id).sort()).toEqual(['fed-b', 'fmi-weo']);
  });
  it('si una fuente falla (sin ítems RSS) los manuales siguen y no hay stale', () => {
    const r = mergeIntl([it_('ecb-viejo', '2026-09-01'), it_('fsb-1', '2026-10-15', { manual: true }), it_('fsb-2', '2026-10-14', { stale: true })], []);
    expect(r.map((n) => n.id)).toEqual(['fsb-1']);
    expect(r.some((n) => 'stale' in n || 'staleNote' in n)).toBe(false);
  });
  it('isManual', () => { expect(isManual({ id: 'fed-1' })).toBe(false); expect(isManual({ id: 'fed-1', manual: true })).toBe(true); expect(isManual({ id: 'otro' })).toBe(true); });
});
