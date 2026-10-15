import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import NewsletterForm from './NewsletterForm';
import { CONTENT_UPDATED, formatDate } from '../lib/content';

export const NAV = [
  ['/', 'Inicio'], ['/banca-panama', 'Banca en Panamá'], ['/internacional', 'Internacional'], ['/activos-digitales', 'Activos digitales'],
  ['/inversiones', 'Inversiones'], ['/calculadoras', 'Calculadoras'], ['/medios-de-pago', 'Medios de pago'], ['/fintech', 'Banca digital y fintech'],
  ['/educacion', 'Ahorro y educación'], ['/finanzas-avanzadas', 'Finanzas avanzadas'], ['/opinion', 'Opinión y análisis'], ['/glosario', 'Glosario'], ['/acerca', 'Acerca de'],
] as const;

export function Logo() {
  return <Link to="/" className="logo" aria-label="Banca del Mañana, inicio"><span className="logo-mark" aria-hidden="true">B<i>m</i></span><span className="logo-text">Banca <b>del Mañana</b></span></Link>;
}

export default function Layout() {
  const [open, setOpen] = useState(false);
  const [theme, setTheme] = useState(() => document.documentElement.dataset.theme || 'light');
  const loc = useLocation();
  const nav = useNavigate();
  useEffect(() => { setOpen(false); window.scrollTo(0, 0); document.getElementById('main')?.focus({ preventScroll: true }); }, [loc.pathname]);
  useEffect(() => { document.documentElement.dataset.theme = theme; try { localStorage.setItem('theme', theme); } catch { /* sin almacenamiento */ } }, [theme]);
  return (
    <>
      <a className="skip" href="#main">Saltar al contenido</a>
      <header className="site-header">
        <div className="container bar">
          <Logo />
          <form role="search" className="search-mini" onSubmit={(e) => { e.preventDefault(); const q = new FormData(e.currentTarget).get('q'); nav(`/buscar?q=${encodeURIComponent(String(q ?? '').slice(0, 100))}`); }}>
            <label htmlFor="q-top" className="sr-only">Buscar en el sitio</label>
            <input id="q-top" name="q" type="search" placeholder="Buscar…" maxLength={100} />
          </form>
          <button className="icon-btn" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} aria-label={theme === 'dark' ? 'Activar modo claro' : 'Activar modo oscuro'}>{theme === 'dark' ? '☀' : '☾'}</button>
          <button className="icon-btn menu-btn" aria-expanded={open} aria-controls="main-nav" onClick={() => setOpen(!open)}>{open ? '✕' : '☰'}<span className="sr-only">Menú</span></button>
        </div>
        <nav id="main-nav" className={`main-nav ${open ? 'open' : ''}`} aria-label="Principal">
          <ul className="container">{NAV.map(([to, label]) => <li key={to}><NavLink to={to} end={to === '/'}>{label}</NavLink></li>)}</ul>
        </nav>
      </header>
      <main id="main" tabIndex={-1} className="container"><Outlet /></main>
      <footer className="site-footer">
        <div className="container footer-news"><NewsletterForm variant="compact" heading="h2" /></div>
        <div className="container footer-grid">
          <div><Logo /><p>Información y educación financiera sobre Panamá y el mundo. Montos en dólares estadounidenses (USD) salvo indicación.</p><p className="small">Contenido actualizado al {formatDate(CONTENT_UPDATED)}.</p></div>
          <div><h2>Secciones</h2><ul>{NAV.slice(1, 7).map(([to, l]) => <li key={to}><Link to={to}>{l}</Link></li>)}</ul></div>
          <div><h2>Más</h2><ul>{NAV.slice(7).map(([to, l]) => <li key={to}><Link to={to}>{l}</Link></li>)}<li><Link to="/fuentes">Fuentes e integraciones</Link></li></ul></div>
          <div><h2>Legal</h2><ul><li><Link to="/metodologia">Metodología editorial</Link></li><li><Link to="/contacto">Contacto</Link></li><li><Link to="/privacidad">Privacidad</Link></li><li><Link to="/terminos">Términos de uso</Link></li><li><Link to="/aviso-legal">Aviso financiero</Link></li></ul></div>
        </div>
        <p className="container small disclaimer">Banca del Mañana es un medio informativo y educativo independiente. No es un banco, no capta fondos ni ofrece asesoría financiera personalizada. Verifique siempre con la entidad y con la Superintendencia correspondiente. © {new Date().getFullYear()} Banca del Mañana.</p>
      </footer>
    </>
  );
}
