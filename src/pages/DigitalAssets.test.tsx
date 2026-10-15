import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import App from '../App';
import { ActivosDigitales, EDU_DISCLAIMER } from './DigitalAssets';
import { NAV } from '../components/Layout';
import { eduPieces, newsDigital } from '../lib/content';

// El Layout lee document.documentElement al inicializar el tema; en SSR de prueba basta un stub mínimo.
(globalThis as { document?: unknown }).document ??= { documentElement: { dataset: {} } };
const at = (path: string) => renderToStaticMarkup(<MemoryRouter initialEntries={[path]}><App /></MemoryRouter>);

describe('Activos digitales', () => {
  it('la página muestra noticias, filtros, guías y aviso educativo', () => {
    const html = renderToStaticMarkup(<MemoryRouter><Routes><Route path="*" element={<ActivosDigitales />} /></Routes></MemoryRouter>);
    expect(html).toContain('Noticias de activos digitales');
    expect(html).toContain('Aprende sobre activos digitales');
    expect(html).toContain(EDU_DISCLAIMER);
    ['Todas', 'Panamá', 'Internacional', 'Banca'].forEach((l) => expect(html).toContain(`>${l}</button>`));
    expect(html).toContain(newsDigital[0].url.replace(/&/g, '&amp;'));
    eduPieces.forEach((e) => expect(html).toContain(`href="/activos-digitales/${e.id}"`));
    expect(html).not.toMatch(/fuente no respondió|No publicado/i);
  });
  it('cada guía tiene página propia con fuentes y aviso', () => {
    for (const e of eduPieces) {
      const html = at(`/activos-digitales/${e.id}`);
      expect(html).toContain(e.title.replace(/&/g, '&amp;'));
      expect(html).toContain('Fuentes');
      expect(html).toContain(EDU_DISCLAIMER);
      expect(html).toContain('Asistido por IA');
    }
  });
  it('guía inexistente muestra 404 suave', () => expect(at('/activos-digitales/no-existe')).toContain('Guía no encontrada'));
  it('el menú ya no incluye Bancos y comparador y sí Activos digitales', () => {
    expect(NAV.some(([to]) => (to as string) === '/bancos')).toBe(false);
    expect(NAV.some(([to, l]) => to === '/activos-digitales' && l === 'Activos digitales')).toBe(true);
  });
  it('/bancos redirige a calculadoras sin 404', () => {
    const html = at('/bancos');
    expect(html).not.toContain('Página no encontrada');
    expect(html).toContain('Calculadoras');
    expect(at('/bancos/algo')).not.toContain('Página no encontrada');
  });
  it('la portada enlaza a Activos digitales', () => expect(at('/')).toContain('href="/activos-digitales"'));
});
