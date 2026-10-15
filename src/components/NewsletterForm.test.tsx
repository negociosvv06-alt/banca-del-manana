import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import NewsletterForm, { NEWSLETTER_ENDPOINT } from './NewsletterForm';

const render = (v: 'section' | 'compact') => renderToStaticMarkup(<MemoryRouter><NewsletterForm variant={v} /></MemoryRouter>);

describe('NewsletterForm', () => {
  it('renderiza título, campo de correo, botón y aviso de privacidad', () => {
    const html = render('section');
    expect(html).toContain('Boletín Banca del Mañana');
    expect(html).toContain('name="fields[email]"');
    expect(html).toContain('Suscribirme');
    expect(html).toContain('Puedes darte de baja cuando quieras');
    expect(html).toContain('href="/privacidad"');
    expect(html).toContain('Boletín semanal gratis');
  });
  it('variante compacta no pide datos distintos al correo', () => {
    const html = render('compact');
    expect(html.match(/<input/g)).toHaveLength(1);
    expect(html).not.toMatch(/password|tarjeta-num|cc-number/);
  });
  it('apunta al endpoint público de MailerLite por https', () => {
    expect(NEWSLETTER_ENDPOINT).toMatch(/^https:\/\/assets\.mailerlite\.com\/jsonp\/\d+\/forms\/\d+\/subscribe$/);
  });
});
