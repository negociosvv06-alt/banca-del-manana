import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import App from '../App';
import { CALCS } from './Calculators';
import { MORTGAGE_SOURCES, RETIREMENT_SOURCES } from '../lib/calc-sources';

(globalThis as { document?: unknown }).document ??= { documentElement: { dataset: {} } };
const at = (path: string) => renderToStaticMarkup(<MemoryRouter initialEntries={[path]}><App /></MemoryRouter>);
const decode = (s: string) => s.replace(/&amp;/g, '&');

describe('calculadoras: hipoteca y jubilación', () => {
  it('están en la lista y en el índice, junto a las existentes', () => {
    const ids = CALCS.map((x) => x.id);
    ['prestamo', 'ahorro', 'meta', 'plazo-fijo', 'deuda', 'emergencia', 'inflacion', 'vpn-tir', 'divisas', 'hipoteca', 'jubilacion'].forEach((id) => expect(ids).toContain(id));
    const html = at('/calculadoras');
    expect(html).toContain('href="/calculadoras/hipoteca"');
    expect(html).toContain('href="/calculadoras/jubilacion"');
  });
  it('hipoteca: valores por defecto, resultado, aviso y fuentes citadas', () => {
    const html = at('/calculadoras/hipoteca');
    expect(html).toContain('Calculadora de hipoteca');
    expect(html).toContain('Cuota mensual:');
    expect(html).toContain('Total de intereses:');
    expect(html).toContain('resumen de amortización por año');
    expect(html).toContain('no constituye asesoría financiera');
    expect(html).toContain('FECI');
    expect(html).toContain('Intereses preferenciales');
    expect(html).toContain('Asistido por IA');
    for (const [, url] of MORTGAGE_SOURCES) expect(decode(html)).toContain(`href="${url}"`);
    expect(html).not.toMatch(/NaN|Infinity|undefined/);
  });
  it('jubilación: resultado, brecha, aviso y fuentes citadas', () => {
    const html = at('/calculadoras/jubilacion');
    expect(html).toContain('Calculadora de jubilación');
    expect(html).toContain('Saldo proyectado a los 62 años');
    expect(html).toMatch(/Brecha:|Va por buen camino/);
    expect(html).toContain('Ahorro mensual necesario');
    expect(html).toContain('no constituye asesoría financiera');
    expect(html).toContain('SIACAP');
    expect(html).toContain('57 años cumplidos las mujeres y 62 los hombres');
    expect(html).toContain('Asistido por IA');
    for (const [, url] of RETIREMENT_SOURCES) expect(decode(html)).toContain(`href="${url}"`);
    expect(html).not.toMatch(/NaN|Infinity|undefined/);
  });
  it('las fuentes son https o fuentes oficiales .gob.pa', () => {
    for (const [, url] of [...MORTGAGE_SOURCES, ...RETIREMENT_SOURCES]) expect(url).toMatch(/^https?:\/\/[^/]*\.gob\.pa\//);
  });
});
