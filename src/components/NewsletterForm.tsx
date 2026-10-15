import { useId, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';

// Formulario público de MailerLite (sin secretos). La respuesta es JSON con CORS abierto.
export const NEWSLETTER_ENDPOINT = 'https://assets.mailerlite.com/jsonp/2713968/forms/201358077404906646/subscribe';
export const NEWSLETTER_TITLE = 'Boletín Banca del Mañana';
export const NEWSLETTER_TEXT = 'Recibe cada semana lo más importante de la banca en Panamá: noticias, análisis y calculadoras. Gratis.';
export const NEWSLETTER_PRIVACY = 'Solo usamos tu correo para enviarte el boletín. Puedes darte de baja cuando quieras.';

type State = 'idle' | 'sending' | 'ok' | 'error';
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function NewsletterForm({ variant = 'section', heading = 'h2' }: { variant?: 'section' | 'compact'; heading?: 'h2' | 'h3' }) {
  const uid = useId();
  const [state, setState] = useState<State>('idle');
  const [msg, setMsg] = useState('');
  const H = heading;

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (state === 'sending') return;
    const form = e.currentTarget;
    const email = String(new FormData(form).get('fields[email]') ?? '').trim();
    if (!EMAIL_RE.test(email) || email.length > 254) { setState('error'); setMsg('Escribe un correo válido.'); return; }
    setState('sending'); setMsg('');
    try {
      const body = new FormData();
      body.set('fields[email]', email); body.set('ml-submit', '1'); body.set('anticsrf', 'true');
      const r = await fetch(NEWSLETTER_ENDPOINT, { method: 'POST', body });
      const j = (await r.json().catch(() => null)) as { success?: boolean; errors?: { fields?: { email?: string[] } } } | null;
      if (r.ok && j?.success) { setState('ok'); form.reset(); return; }
      setState('error');
      setMsg(j?.errors?.fields?.email ? 'Escribe un correo válido.' : 'No pudimos completar la suscripción. Inténtalo de nuevo en unos minutos.');
    } catch {
      setState('error'); setMsg('No pudimos conectar. Revisa tu conexión e inténtalo de nuevo.');
    }
  }

  return (
    <section className={`newsletter ${variant === 'compact' ? 'newsletter-compact' : 'card'}`} aria-labelledby={`${uid}-h`}>
      <H id={`${uid}-h`}>{NEWSLETTER_TITLE}</H>
      {variant === 'section' && <p className="kicker-nl">Boletín semanal gratis</p>}
      <p>{NEWSLETTER_TEXT}</p>
      {state === 'ok' ? (
        <p className="nl-ok" role="status">¡Gracias! Revisa tu correo para confirmar tu suscripción.</p>
      ) : (
        <form className="nl-form" onSubmit={onSubmit} noValidate>
          <label htmlFor={`${uid}-e`} className="sr-only">Correo electrónico</label>
          <input id={`${uid}-e`} name="fields[email]" type="email" inputMode="email" autoComplete="email" placeholder="tucorreo@ejemplo.com" maxLength={254} required aria-invalid={state === 'error'} aria-describedby={`${uid}-m`} />
          <button type="submit" className="btn" disabled={state === 'sending'}>{state === 'sending' ? 'Enviando…' : 'Suscribirme'}</button>
        </form>
      )}
      <p id={`${uid}-m`} className="field-err" role="alert">{state === 'error' ? msg : ''}</p>
      <p className="small muted">{NEWSLETTER_PRIVACY} <Link to="/privacidad">Política de privacidad</Link>.</p>
    </section>
  );
}
