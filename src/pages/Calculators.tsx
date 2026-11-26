import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useParams, Link } from 'react-router-dom';
import * as c from '../lib/calc';
import { MORTGAGE_SOURCES, RETIREMENT_SOURCES } from '../lib/calc-sources';
import { PageHeader, useSeo, usd } from '../components/ui';

function Num({ id, label, value, set, min = 0, max = 1e12, step = 'any', suffix }: { id: string; label: string; value: string; set: (v: string) => void; min?: number; max?: number; step?: string; suffix?: string }) {
  const n = Number(value);
  const err = value === '' ? 'Requerido' : !Number.isFinite(n) ? 'Número inválido' : n < min ? `Mínimo ${min}` : n > max ? `Máximo ${max.toLocaleString('es-PA')}` : '';
  return (
    <div className="field">
      <label htmlFor={id}>{label}{suffix && <span className="suffix"> ({suffix})</span>}</label>
      <input id={id} inputMode="decimal" type="number" min={min} max={max} step={step} value={value} onChange={(e) => set(e.target.value)} aria-invalid={!!err} aria-describedby={err ? id + '-err' : undefined} />
      {err && <span className="field-err" id={id + '-err'}>{err}</span>}
    </div>
  );
}
const valid = (...v: [string, number, number][]) => v.every(([s, min, max]) => s !== '' && Number.isFinite(+s) && +s >= min && +s <= max);
function Result({ ok, children }: { ok: boolean; children: ReactNode }) {
  return <div className="result" aria-live="polite">{ok ? children : <p className="muted">Complete los campos con valores válidos para ver el resultado.</p>}</div>;
}
const Note = () => <p className="small muted">Resultado aproximado con fines educativos. No incluye seguros, comisiones, FECI ni otros cargos salvo que se indique. Confirme las condiciones con la entidad.</p>;

function Loan() {
  const [p, setP] = useState('10000'), [r, setR] = useState('12'), [m, setM] = useState('12'), [show, setShow] = useState(false);
  const ok = valid([p, 1, 1e9], [r, 0, 100], [m, 1, 600]);
  const rows = useMemo(() => (ok ? c.amortization(+p, +r, Math.round(+m)) : []), [ok, p, r, m]);
  const pmt = rows[0]?.payment ?? 0, total = rows.reduce((s, x) => s + x.payment, 0);
  return <>
    <div className="form-grid"><Num id="l-p" label="Monto del préstamo" suffix="USD" value={p} set={setP} min={1} max={1e9} /><Num id="l-r" label="Tasa de interés anual" suffix="%" value={r} set={setR} max={100} /><Num id="l-m" label="Plazo" suffix="meses" value={m} set={setM} min={1} max={600} step="1" /></div>
    <Result ok={ok}><p className="big">Cuota mensual: <strong>{usd(pmt)}</strong></p><p>Total pagado: {usd(total)} · Intereses: {usd(total - +p)}</p>
      <button className="btn" onClick={() => setShow(!show)} aria-expanded={show}>{show ? 'Ocultar' : 'Ver'} tabla de amortización</button>
      {show && <div className="table-wrap"><table><caption className="sr-only">Tabla de amortización</caption><thead><tr><th>Mes</th><th>Cuota</th><th>Interés</th><th>Capital</th><th>Saldo</th></tr></thead><tbody>{rows.map((x) => <tr key={x.n}><td>{x.n}</td><td>{usd(x.payment)}</td><td>{usd(x.interest)}</td><td>{usd(x.principal)}</td><td>{usd(x.balance)}</td></tr>)}</tbody></table></div>}
    </Result><Note /></>;
}
function Savings() {
  const [i, setI] = useState('1000'), [mo, setMo] = useState('100'), [r, setR] = useState('3'), [y, setY] = useState('5');
  const ok = valid([i, 0, 1e9], [mo, 0, 1e8], [r, 0, 50], [y, 0, 80]);
  const fv = ok ? c.futureValue(+i, +mo, +r, Math.round(+y * 12)) : 0, contrib = +i + +mo * Math.round(+y * 12);
  return <><div className="form-grid"><Num id="s-i" label="Ahorro inicial" suffix="USD" value={i} set={setI} max={1e9} /><Num id="s-m" label="Aporte mensual" suffix="USD" value={mo} set={setMo} max={1e8} /><Num id="s-r" label="Tasa anual" suffix="%" value={r} set={setR} max={50} /><Num id="s-y" label="Plazo" suffix="años" value={y} set={setY} max={80} /></div>
    <Result ok={ok}><p className="big">Saldo final: <strong>{usd(fv)}</strong></p><p>Aportado: {usd(contrib)} · Intereses ganados: {usd(fv - contrib)}</p></Result><Note /></>;
}
function Goal() {
  const [g, setG] = useState('5000'), [i, setI] = useState('0'), [r, setR] = useState('3'), [m, setM] = useState('24');
  const ok = valid([g, 1, 1e9], [i, 0, 1e9], [r, 0, 50], [m, 1, 960]);
  return <><div className="form-grid"><Num id="g-g" label="Meta" suffix="USD" value={g} set={setG} min={1} max={1e9} /><Num id="g-i" label="Ya ahorrado" suffix="USD" value={i} set={setI} max={1e9} /><Num id="g-r" label="Tasa anual" suffix="%" value={r} set={setR} max={50} /><Num id="g-m" label="Plazo" suffix="meses" value={m} set={setM} min={1} max={960} step="1" /></div>
    <Result ok={ok}><p className="big">Debe ahorrar: <strong>{usd(ok ? c.monthlyForGoal(+g, +i, +r, Math.round(+m)) : 0)}</strong> al mes</p></Result><Note /></>;
}
function Deposit() {
  const [a, setA] = useState('10000'), [r, setR] = useState('4'), [m, setM] = useState('12'), [t, setT] = useState('0'), [comp, setComp] = useState(false);
  const ok = valid([a, 1, 1e9], [r, 0, 50], [m, 1, 600], [t, 0, 100]);
  const res = ok ? c.timeDeposit(+a, +r, +m, comp, +t) : null;
  return <><div className="form-grid"><Num id="d-a" label="Monto" suffix="USD" value={a} set={setA} min={1} max={1e9} /><Num id="d-r" label="Tasa anual" suffix="%" value={r} set={setR} max={50} /><Num id="d-m" label="Plazo" suffix="meses" value={m} set={setM} min={1} max={600} /><Num id="d-t" label="Retención de impuesto (si aplica)" suffix="%" value={t} set={setT} max={100} />
    <div className="field"><label><input type="checkbox" checked={comp} onChange={(e) => setComp(e.target.checked)} /> Intereses capitalizables mensualmente</label></div></div>
    <Result ok={ok}>{res && <><p className="big">Total al vencimiento: <strong>{usd(res.total)}</strong></p><p>Interés bruto: {usd(res.gross)} · Retención: {usd(res.tax)} · Interés neto: {usd(res.net)}</p></>}</Result>
    <p className="small muted">La tasa y el tratamiento fiscal dependen de cada banco y de la normativa vigente; esta calculadora no asume ninguna tasa de mercado.</p></>;
}
function Debt() {
  const [b, setB] = useState('3000'), [r, setR] = useState('24'), [p, setP] = useState('150');
  const ok = valid([b, 1, 1e9], [r, 0, 100], [p, 1, 1e9]);
  const n = ok ? c.debtPayoffMonths(+b, +r, +p) : 0;
  return <><div className="form-grid"><Num id="t-b" label="Saldo de la deuda" suffix="USD" value={b} set={setB} min={1} max={1e9} /><Num id="t-r" label="Tasa anual" suffix="%" value={r} set={setR} max={100} /><Num id="t-p" label="Pago mensual" suffix="USD" value={p} set={setP} min={1} max={1e9} /></div>
    <Result ok={ok}>{n === Infinity ? <p className="warn">Con ese pago la deuda nunca se termina: no cubre los intereses del mes ({usd(+b * +r / 1200)}).</p> : <p className="big">Terminarías en <strong>{n} meses</strong> (~{(n / 12).toFixed(1)} años)</p>}</Result><Note /></>;
}
function Emergency() {
  const [e, setE] = useState('1200'), [m, setM] = useState('6'), [s, setS] = useState('1500');
  const ok = valid([e, 0, 1e8], [m, 1, 24], [s, 0, 1e9]);
  const res = ok ? c.emergencyFund(+e, +m, +s) : null;
  return <><div className="form-grid"><Num id="e-e" label="Gastos esenciales mensuales" suffix="USD" value={e} set={setE} max={1e8} /><Num id="e-m" label="Meses de cobertura deseados" value={m} set={setM} min={1} max={24} /><Num id="e-s" label="Ya ahorrado" suffix="USD" value={s} set={setS} max={1e9} /></div>
    <Result ok={ok}>{res && <><p className="big">Meta: <strong>{usd(res.target)}</strong></p><p>Te falta {usd(res.missing)} · Cobertura actual: {Number.isFinite(res.coverageMonths) ? res.coverageMonths.toFixed(1) + ' meses' : '—'}</p></>}</Result></>;
}
function Inflation() {
  const [a, setA] = useState('1000'), [i, setI] = useState('2'), [y, setY] = useState('10');
  const ok = valid([a, 0, 1e12], [i, -50, 1000], [y, 0, 100]);
  return <><div className="form-grid"><Num id="i-a" label="Monto actual" suffix="USD" value={a} set={setA} max={1e12} /><Num id="i-i" label="Inflación anual supuesta" suffix="%" value={i} set={setI} min={-50} max={1000} /><Num id="i-y" label="Años" value={y} set={setY} max={100} /></div>
    <Result ok={ok}><p className="big">Poder de compra equivalente: <strong>{usd(ok ? c.realValue(+a, +i, +y) : 0)}</strong></p></Result>
    <p className="small muted">La inflación es un supuesto del usuario; consulte el INEC para el IPC oficial de Panamá.</p></>;
}
function Npv() {
  const [r, setR] = useState('10'), [f, setF] = useState('-1000, 300, 400, 500');
  const flows = f.split(/[,;\s]+/).filter(Boolean).map(Number);
  const okFlows = flows.length >= 2 && flows.length <= 100 && flows.every(Number.isFinite);
  const ok = okFlows && valid([r, -99, 1000]);
  const tir = ok ? c.irr(flows) : null;
  return <><div className="form-grid"><Num id="v-r" label="Tasa de descuento" suffix="%" value={r} set={setR} min={-99} max={1000} />
    <div className="field wide"><label htmlFor="v-f">Flujos por periodo (USD), separados por comas; el primero suele ser la inversión negativa</label><input id="v-f" value={f} maxLength={2000} onChange={(e) => setF(e.target.value)} aria-invalid={!okFlows} />{!okFlows && <span className="field-err">Ingrese entre 2 y 100 números.</span>}</div></div>
    <Result ok={ok}><p className="big">VPN: <strong>{usd(ok ? c.npv(+r, flows) : 0)}</strong></p><p>TIR: {tir === null ? 'No se puede calcular (los flujos no cambian de signo)' : tir.toFixed(2) + ' %'}</p></Result></>;
}

const NO_ADVICE = 'Esta calculadora es una herramienta educativa y no constituye asesoría financiera.';
const ExtLink = ({ href, children }: { href: string; children: ReactNode }) => <a href={href} target="_blank" rel="noopener noreferrer">{children}</a>;
const Sources = ({ items }: { items: [string, string][] }) => <section aria-label="Fuentes"><h2 className="small">Fuentes</h2><ul className="small">{items.map(([name, url]) => <li key={url}><ExtLink href={url}>{name}</ExtLink></li>)}</ul></section>;
const AiNote = () => <span className="ai-label">Asistido por IA</span>;

function Mortgage() {
  const [p, setP] = useState('150000'), [d, setD] = useState('10'), [r, setR] = useState('6'), [y, setY] = useState('30'), [ins, setIns] = useState('0'), [feci, setFeci] = useState(false), [show, setShow] = useState(false);
  const ok = valid([p, 1, 1e9], [d, 0, 99], [r, 0, 100], [y, 1, 50], [ins, 0, 1e7]);
  const m = useMemo(() => (ok ? c.mortgage(+p, +d, +r, +y, feci, +ins) : null), [ok, p, d, r, y, ins, feci]);
  const years = useMemo(() => (m ? c.amortizationByYear(m.rows) : []), [m]);
  return <>
    <div className="form-grid"><Num id="h-p" label="Precio de la vivienda" suffix="USD" value={p} set={setP} min={1} max={1e9} /><Num id="h-d" label="Abono inicial" suffix="% del precio" value={d} set={setD} max={99} /><Num id="h-r" label="Tasa de interés anual" suffix="%" value={r} set={setR} max={100} /><Num id="h-y" label="Plazo" suffix="años" value={y} set={setY} min={1} max={50} />
      <Num id="h-s" label="Seguros mensuales (opcional)" suffix="USD" value={ins} set={setIns} max={1e7} />
      <div className="field"><label><input type="checkbox" checked={feci} onChange={(e) => setFeci(e.target.checked)} /> Sumar FECI (1 % anual), solo si no es su vivienda principal</label></div></div>
    <Result ok={ok}>{m && <>
      <p className="big">Cuota mensual: <strong>{usd(m.payment)}</strong></p>
      {+ins > 0 && <p>Cuota con seguros: <strong>{usd(m.monthlyTotal)}</strong> al mes</p>}
      <p>Monto financiado: {usd(m.loan)} · Abono inicial: {usd(m.down)}{feci && <> · Tasa con FECI: {m.effectiveRate.toFixed(2)} %</>}</p>
      <p>Total de intereses: <strong>{usd(m.totalInterest)}</strong> · Total pagado al banco: {usd(m.totalPaid)} ({m.months} cuotas)</p>
      <p className="small">Intereses = {((m.totalInterest / m.totalPaid) * 100).toFixed(1)} % de lo pagado. Al final de los años 5 y 10 el saldo pendiente sería {usd(years[4]?.balance ?? 0)} y {usd(years[9]?.balance ?? 0)}.</p>
      <button className="btn" onClick={() => setShow(!show)} aria-expanded={show}>{show ? 'Ocultar' : 'Ver'} resumen de amortización por año</button>
      {show && <div className="table-wrap"><table><caption className="sr-only">Resumen de amortización por año</caption><thead><tr><th>Año</th><th>Pagado</th><th>Interés</th><th>Capital</th><th>Saldo</th></tr></thead><tbody>{years.map((x) => <tr key={x.year}><td>{x.year}</td><td>{usd(x.payment)}</td><td>{usd(x.interest)}</td><td>{usd(x.principal)}</td><td>{usd(x.balance)}</td></tr>)}</tbody></table></div>}
    </>}</Result>
    <p className="small muted">{NO_ADVICE} Resultado aproximado: usa cuota fija (sistema francés) y no incluye comisiones de cierre, avalúo, notaría ni impuestos. Los seguros se suman como un monto mensual que usted ingresa. Confirme las condiciones con su banco. Consulte el <Link to="/aviso-legal">aviso financiero</Link>.</p>
    <section className="edu-note" role="note" aria-label="Nota educativa sobre FECI e intereses preferenciales"><p><AiNote /> <strong>FECI.</strong> El Fondo Especial de Compensación de Intereses (FECI) se financia con una retención del 1 % anual sobre préstamos locales personales y comerciales mayores de B/.5,000 (Ley 4 de 1994, art. 2). Según el criterio 19 de la Comisión FECI, solo el préstamo para adquirir la vivienda principal (la de uso permanente del propietario) queda excluido de esa retención, y ese beneficio se agota en un solo préstamo. Marque la casilla solo si su caso no es una vivienda principal; la calculadora lo aproxima sumando un punto porcentual a la tasa. Su banco confirma si aplica.</p>
      <p><strong>Intereses preferenciales.</strong> La Ley 468 de 2025, modificada por la Ley 481 de 2025 (vigente desde el 1 de enero de 2026) y reglamentada por decretos del MEF, establece un subsidio estatal a la tasa de interés para ciertas hipotecas. Entre sus condiciones, la ley exige que sea una vivienda nueva destinada a residencia principal, con precio de compra de hasta B/.120,000 (incluidos terreno y mejoras), que el beneficiario sea panameño o extranjero con residencia permanente, que no tenga otra vivienda inscrita en el Registro Público y que use el beneficio una sola vez. El subsidio se aplica por tramos según el precio y la región, y por un plazo limitado. Esta calculadora no calcula el subsidio: si su préstamo califica, ingrese la tasa neta que le confirme su banco. Consulte el texto vigente y a su banco o al MIVIOT antes de decidir.</p></section>
    <Sources items={MORTGAGE_SOURCES} /></>;
}

function Retirement() {
  const [age, setAge] = useState('30'), [ra, setRa] = useState('62'), [sv, setSv] = useState('5000'), [mo, setMo] = useState('200'), [rt, setRt] = useState('5'), [inf, setInf] = useState('2'), [ti, setTi] = useState('1500'), [ry, setRy] = useState('25');
  const ok = valid([age, 18, 99], [ra, 19, 100], [sv, 0, 1e9], [mo, 0, 1e8], [rt, 0, 50], [inf, 0, 50], [ti, 0, 1e7], [ry, 1, 60]) && +ra > +age;
  const res = useMemo(() => (ok ? c.retirementPlan({ age: +age, retireAge: +ra, savings: +sv, monthly: +mo, returnPct: +rt, inflationPct: +inf, targetIncome: +ti, retirementYears: +ry }) : null), [ok, age, ra, sv, mo, rt, inf, ti, ry]);
  return <>
    <div className="form-grid"><Num id="j-a" label="Edad actual" suffix="años" value={age} set={setAge} min={18} max={99} step="1" /><Num id="j-r" label="Edad de jubilación" suffix="años" value={ra} set={setRa} min={19} max={100} step="1" />
      <Num id="j-s" label="Ahorro actual" suffix="USD" value={sv} set={setSv} max={1e9} /><Num id="j-m" label="Aporte mensual" suffix="USD" value={mo} set={setMo} max={1e8} />
      <Num id="j-t" label="Rendimiento anual esperado" suffix="%" value={rt} set={setRt} max={50} /><Num id="j-i" label="Inflación anual supuesta" suffix="%" value={inf} set={setInf} max={50} />
      <Num id="j-g" label="Ingreso mensual deseado (en dólares de hoy)" suffix="USD" value={ti} set={setTi} max={1e7} /><Num id="j-y" label="Años de retiro a financiar" suffix="años" value={ry} set={setRy} min={1} max={60} step="1" /></div>
    {ok && +ra <= +age && <p className="warn">La edad de jubilación debe ser mayor que la edad actual.</p>}
    <Result ok={ok}>{res && <>
      <p className="big">Saldo proyectado a los {ra} años: <strong>{usd(res.projectedNominal)}</strong></p>
      <p>En dólares de hoy: {usd(res.projectedReal)} · Capital necesario: <strong>{usd(res.neededNominal)}</strong> ({usd(res.neededReal)} en dólares de hoy)</p>
      {res.onTrack
        ? <p className="big">Va por buen camino: su plan cubre el ingreso deseado. Ingreso sostenible estimado: <strong>{usd(res.sustainableIncomeReal)}</strong> al mes (dólares de hoy).</p>
        : <><p className="big">Brecha: <strong>{usd(res.gapNominal)}</strong> ({usd(res.gapReal)} en dólares de hoy)</p>
          <p>Ahorro mensual necesario: <strong>{usd(res.requiredMonthly)}</strong> (unos {usd(res.extraMonthly)} más que ahora). Con su aporte actual, el ingreso sostenible sería de {usd(res.sustainableIncomeReal)} al mes en dólares de hoy.</p></>}
    </>}</Result>
    <p className="small muted">{NO_ADVICE} Proyección con supuestos que usted elige: aportes constantes al final de cada mes, rendimiento con capitalización mensual y retiros mensuales ajustados por inflación durante los años de retiro indicados. El rendimiento real no está garantizado, y no incluye pensiones de la CSS, SIACAP ni otros ingresos. Consulte el <Link to="/aviso-legal">aviso financiero</Link>.</p>
    <section className="edu-note" role="note" aria-label="Nota educativa sobre CSS y SIACAP"><p><AiNote /> <strong>CSS.</strong> Según la Caja de Seguro Social, la pensión por vejez requiere tener 57 años cumplidos las mujeres y 62 los hombres, y 240 cuotas a partir del 1 de enero de 2013 (Ley 51 de 2005). Úselo como referencia para la edad de jubilación; esta calculadora no estima el monto de la pensión de la CSS, que se calcula según sus cuotas y salarios.</p>
      <p><strong>SIACAP.</strong> El Sistema de Ahorro y Capitalización de Pensiones de los Servidores Públicos se creó con la Ley 8 de 1997 y busca otorgar beneficios adicionales a las pensiones de invalidez, incapacidad por riesgo profesional y vejez que la CSS concede al servidor público. Aplica a servidores públicos, no a todos los trabajadores. Para retirar el ahorro de la cuenta individual hay que cumplir uno de los requisitos de la ley, por ejemplo haber cumplido la edad que exige la Ley Orgánica de la CSS para jubilarse por vejez. Si usted es servidor público, sume ese ahorro a su «Ahorro actual» o pregunte a SIACAP cuánto tiene acumulado.</p></section>
    <Sources items={RETIREMENT_SOURCES} /></>;
}

interface Fx { date: string; base: string; rates: Record<string, number> }
function FxConverter() {
  const [amt, setAmt] = useState('100'), [cur, setCur] = useState('EUR'), [data, setData] = useState<Fx | null>(null), [state, setState] = useState<'loading' | 'ok' | 'error'>('loading'), [manual, setManual] = useState(''), [fetchedAt, setFetchedAt] = useState('');
  const api = (import.meta.env.VITE_FX_API_URL as string | undefined) ?? 'https://api.frankfurter.dev/v1/latest?base=USD';
  useEffect(() => {
    const ctrl = new AbortController();
    fetch(api, { signal: ctrl.signal }).then((r) => { if (!r.ok) throw new Error(); return r.json(); }).then((d: Fx) => {
      if (!d?.rates || typeof d.date !== 'string') throw new Error();
      setData(d); setState('ok'); setFetchedAt(new Date().toLocaleString('es-PA'));
    }).catch((e) => { if (e?.name !== 'AbortError') setState('error'); });
    return () => ctrl.abort();
  }, [api]);
  const rate = manual !== '' ? Number(manual) : data?.rates[cur];
  const ok = valid([amt, 0, 1e12]) && !!rate && rate > 0;
  return <>
    <div className="form-grid"><Num id="fx-a" label="Monto" suffix="USD" value={amt} set={setAmt} max={1e12} />
      <div className="field"><label htmlFor="fx-c">Moneda destino</label><select id="fx-c" value={cur} onChange={(e) => setCur(e.target.value)}>{(data ? Object.keys(data.rates) : ['EUR', 'MXN', 'COP', 'CRC', 'GBP', 'JPY']).map((k) => <option key={k}>{k}</option>)}</select></div>
      <div className="field"><label htmlFor="fx-m">Tasa manual (opcional): {cur} por 1 USD</label><input id="fx-m" type="number" min={0} step="any" value={manual} onChange={(e) => setManual(e.target.value)} /></div></div>
    {state === 'loading' && <p className="loading" role="status">Cargando tipos de referencia…</p>}
    {state === 'error' && <p className="warn" role="alert">No se pudo obtener la tasa de referencia. Use el modo manual con la tasa que le cotice su banco.</p>}
    <Result ok={ok}><p className="big">{usd(+amt)} = <strong>{ok ? c.convert(+amt, rate!).toLocaleString('es-PA', { maximumFractionDigits: 4 }) : '—'} {cur}</strong></p>
      <p className="small">{manual !== '' ? 'Tasa ingresada manualmente por el usuario.' : data ? <>Tasa de referencia {data.rates[cur] ?? 'no disponible'} · Fuente: <a href="https://frankfurter.dev/" target="_blank" rel="noopener noreferrer">Frankfurter</a> (tipos de referencia publicados por el BCE) · Fecha de la tasa: {data.date} · Consultado: {fetchedAt}</> : ''}</p></Result>
    <p className="small muted">Las tasas de referencia no son las que aplica un banco o casa de cambio, que incluyen margen y comisiones. El balboa (PAB) circula a la par con el USD.</p></>;
}

export const CALCS: { id: string; title: string; desc: string; C: () => ReactNode }[] = [
  { id: 'prestamo', title: 'Préstamos y amortización', desc: 'Cuota mensual, intereses y tabla de amortización (sistema francés).', C: Loan },
  { id: 'ahorro', title: 'Ahorro e inversión con interés compuesto', desc: 'Proyecta tu saldo con aporte inicial y mensual.', C: Savings },
  { id: 'meta', title: 'Meta de ahorro', desc: 'Cuánto ahorrar al mes para llegar a tu meta.', C: Goal },
  { id: 'plazo-fijo', title: 'Depósito a plazo fijo', desc: 'Interés simple o capitalizable, con retención opcional.', C: Deposit },
  { id: 'deuda', title: 'Pago de deudas y tarjetas', desc: 'Cuántos meses tardarás en salir de una deuda.', C: Debt },
  { id: 'emergencia', title: 'Fondo de emergencia', desc: 'Cuánto necesitas y cuánto te falta.', C: Emergency },
  { id: 'inflacion', title: 'Inflación y poder de compra', desc: 'Valor real de tu dinero en el tiempo.', C: Inflation },
  { id: 'vpn-tir', title: 'VPN y TIR', desc: 'Evalúa proyectos con flujos de caja.', C: Npv },
  { id: 'hipoteca', title: 'Calculadora de hipoteca', desc: 'Cuota mensual, intereses totales y amortización de un préstamo hipotecario en Panamá.', C: Mortgage },
  { id: 'jubilacion', title: 'Calculadora de jubilación', desc: 'Saldo proyectado, brecha y ahorro mensual para el ingreso que quieres al jubilarte.', C: Retirement },
  { id: 'divisas', title: 'Conversor de divisas', desc: 'Tipos de referencia del BCE vía Frankfurter, o tasa manual.', C: FxConverter },
];

export default function Calculators() {
  const { id } = useParams();
  const calc = CALCS.find((x) => x.id === id);
  useSeo(calc ? calc.title : 'Calculadoras financieras', calc?.desc ?? 'Calculadoras de préstamos, hipoteca, jubilación, ahorro, plazo fijo, deudas, inflación, VPN/TIR y divisas.');
  if (id && !calc) return <PageHeader title="Calculadora no encontrada" intro="Revise la lista de calculadoras disponibles."><Link to="/calculadoras">Ver calculadoras</Link></PageHeader>;
  if (calc) return <><p className="crumbs"><Link to="/calculadoras">Calculadoras</Link> › {calc.title}</p><PageHeader title={calc.title} intro={calc.desc} /><section className="card calc"><calc.C /></section></>;
  return <><PageHeader title="Calculadoras financieras" intro="Herramientas verificadas con pruebas automatizadas. Los cálculos se hacen en tu navegador; no guardamos los datos que ingresas." />
    <div className="grid">{CALCS.map((x) => <Link key={x.id} to={`/calculadoras/${x.id}`} className="card tool"><h2>{x.title}</h2><p>{x.desc}</p></Link>)}</div></>;
}
