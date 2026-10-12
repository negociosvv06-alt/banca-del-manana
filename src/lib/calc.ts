// Funciones financieras puras. Tasas en % anual. Montos en USD.
export const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

function assertFinite(...vals: number[]) {
  for (const v of vals) if (!Number.isFinite(v)) throw new Error('Valor no numérico');
}

/** Cuota mensual sistema francés. */
export function loanPayment(principal: number, annualRate: number, months: number): number {
  assertFinite(principal, annualRate, months);
  if (principal <= 0 || months <= 0 || annualRate < 0) throw new Error('Datos inválidos');
  const r = annualRate / 100 / 12;
  if (r === 0) return principal / months;
  return (principal * r) / (1 - Math.pow(1 + r, -months));
}

export interface AmortRow { n: number; payment: number; interest: number; principal: number; balance: number }
export function amortization(principal: number, annualRate: number, months: number): AmortRow[] {
  const pmt = loanPayment(principal, annualRate, months);
  const r = annualRate / 100 / 12;
  const rows: AmortRow[] = [];
  let bal = principal;
  for (let n = 1; n <= months; n++) {
    const interest = bal * r;
    let princ = pmt - interest;
    if (n === months) princ = bal;
    bal = Math.max(0, bal - princ);
    rows.push({ n, payment: interest + princ, interest, principal: princ, balance: bal });
  }
  return rows;
}

/** Valor futuro con aporte inicial y aportes mensuales al final de cada mes, capitalización mensual. */
export function futureValue(initial: number, monthly: number, annualRate: number, months: number): number {
  assertFinite(initial, monthly, annualRate, months);
  if (initial < 0 || monthly < 0 || months < 0 || annualRate < 0) throw new Error('Datos inválidos');
  const r = annualRate / 100 / 12;
  if (r === 0) return initial + monthly * months;
  const g = Math.pow(1 + r, months);
  return initial * g + monthly * ((g - 1) / r);
}

/** Aporte mensual necesario para alcanzar una meta. */
export function monthlyForGoal(goal: number, initial: number, annualRate: number, months: number): number {
  assertFinite(goal, initial, annualRate, months);
  if (goal <= 0 || months <= 0 || initial < 0 || annualRate < 0) throw new Error('Datos inválidos');
  const r = annualRate / 100 / 12;
  const g = r === 0 ? 1 : Math.pow(1 + r, months);
  const remaining = goal - initial * g;
  if (remaining <= 0) return 0;
  return r === 0 ? remaining / months : (remaining * r) / (g - 1);
}

/** Depósito a plazo: interés simple (pago al vencimiento) o compuesto mensual. Retención opcional en %. */
export function timeDeposit(amount: number, annualRate: number, months: number, compound: boolean, taxPct = 0) {
  assertFinite(amount, annualRate, months, taxPct);
  if (amount <= 0 || months <= 0 || annualRate < 0 || taxPct < 0 || taxPct > 100) throw new Error('Datos inválidos');
  const gross = compound ? amount * Math.pow(1 + annualRate / 100 / 12, months) - amount : amount * (annualRate / 100) * (months / 12);
  const tax = gross * (taxPct / 100);
  return { gross, tax, net: gross - tax, total: amount + gross - tax };
}

/** Meses para pagar una deuda con pago fijo. Infinity si el pago no cubre intereses. */
export function debtPayoffMonths(balance: number, annualRate: number, payment: number): number {
  assertFinite(balance, annualRate, payment);
  if (balance <= 0 || payment <= 0 || annualRate < 0) throw new Error('Datos inválidos');
  const r = annualRate / 100 / 12;
  if (r === 0) return Math.ceil(balance / payment);
  if (payment <= balance * r) return Infinity;
  return Math.ceil(-Math.log(1 - (r * balance) / payment) / Math.log(1 + r));
}

/** Valor real tras inflación. */
export function realValue(amount: number, inflationPct: number, years: number): number {
  assertFinite(amount, inflationPct, years);
  if (inflationPct <= -100 || years < 0) throw new Error('Datos inválidos');
  return amount / Math.pow(1 + inflationPct / 100, years);
}

export function emergencyFund(monthlyExpenses: number, monthsTarget: number, saved: number) {
  assertFinite(monthlyExpenses, monthsTarget, saved);
  if (monthlyExpenses < 0 || monthsTarget <= 0 || saved < 0) throw new Error('Datos inválidos');
  const target = monthlyExpenses * monthsTarget;
  return { target, missing: Math.max(0, target - saved), coverageMonths: monthlyExpenses ? saved / monthlyExpenses : Infinity };
}

export function npv(ratePct: number, flows: number[]): number {
  assertFinite(ratePct, ...flows);
  if (ratePct <= -100) throw new Error('Datos inválidos');
  return flows.reduce((acc, f, t) => acc + f / Math.pow(1 + ratePct / 100, t), 0);
}

/** TIR por bisección. Devuelve null si no hay cambio de signo. */
export function irr(flows: number[]): number | null {
  assertFinite(...flows);
  let lo = -99.99, hi = 1000;
  const f = (r: number) => npv(r, flows);
  let flo = f(lo), fhi = f(hi);
  if (flo * fhi > 0) return null;
  for (let i = 0; i < 300; i++) {
    const mid = (lo + hi) / 2, fm = f(mid);
    if (Math.abs(fm) < 1e-9) return mid;
    if (flo * fm < 0) { hi = mid; fhi = fm; } else { lo = mid; flo = fm; }
  }
  return (lo + hi) / 2;
}

/** Conversión de divisas con tasa explícita (unidades de destino por 1 de origen). */
export function convert(amount: number, rate: number): number {
  assertFinite(amount, rate);
  if (rate <= 0) throw new Error('Tasa inválida');
  return amount * rate;
}
