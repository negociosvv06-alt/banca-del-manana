import { describe, it, expect } from 'vitest';
import * as c from './calc';

describe('loanPayment', () => {
  it('caso conocido: 10,000 al 12% 12 meses = 888.49', () => expect(c.round2(c.loanPayment(10000, 12, 12))).toBe(888.49));
  it('hipoteca 200,000 al 6% 360 meses = 1199.10', () => expect(c.round2(c.loanPayment(200000, 6, 360))).toBe(1199.1));
  it('tasa 0', () => expect(c.loanPayment(1200, 0, 12)).toBe(100));
  it('rechaza negativos y cero', () => {
    expect(() => c.loanPayment(-1, 5, 12)).toThrow();
    expect(() => c.loanPayment(1000, 5, 0)).toThrow();
    expect(() => c.loanPayment(NaN, 5, 12)).toThrow();
  });
  it('valores extremos finitos', () => expect(Number.isFinite(c.loanPayment(1e9, 99, 600))).toBe(true));
});

describe('amortization', () => {
  it('saldo final 0 y suma de capital = principal', () => {
    const rows = c.amortization(10000, 12, 12);
    expect(rows).toHaveLength(12);
    expect(rows[11].balance).toBe(0);
    expect(c.round2(rows.reduce((s, r) => s + r.principal, 0))).toBe(10000);
    expect(c.round2(rows[0].interest)).toBe(100);
  });
});

describe('futureValue', () => {
  it('1000 al 5% 10 años = 1647.01', () => expect(c.round2(c.futureValue(1000, 0, 5, 120))).toBe(1647.01));
  it('aportes 100/mes al 6% 12 meses = 1233.56', () => expect(c.round2(c.futureValue(0, 100, 6, 12))).toBe(1233.56));
  it('tasa 0', () => expect(c.futureValue(100, 10, 0, 10)).toBe(200));
  it('negativos', () => expect(() => c.futureValue(-5, 0, 1, 1)).toThrow());
});

describe('monthlyForGoal', () => {
  it('inverso de futureValue', () => {
    const m = c.monthlyForGoal(1233.56, 0, 6, 12);
    expect(c.round2(m)).toBe(100);
  });
  it('meta ya cubierta = 0', () => expect(c.monthlyForGoal(100, 500, 1, 12)).toBe(0));
});

describe('timeDeposit', () => {
  it('simple 10,000 al 4% 12 meses = 400', () => expect(c.round2(c.timeDeposit(10000, 4, 12, false).gross)).toBe(400));
  it('retención 5%', () => expect(c.round2(c.timeDeposit(10000, 4, 12, false, 5).net)).toBe(380));
  it('compuesto mayor que simple', () => expect(c.timeDeposit(10000, 4, 12, true).gross).toBeGreaterThan(400));
  it('retención inválida', () => expect(() => c.timeDeposit(1, 1, 1, false, 150)).toThrow());
});

describe('debtPayoffMonths', () => {
  it('pago que no cubre interés = Infinity', () => expect(c.debtPayoffMonths(10000, 24, 200)).toBe(Infinity));
  it('consistente con loanPayment', () => expect(c.debtPayoffMonths(10000, 12, 888.49)).toBe(12));
  it('tasa 0', () => expect(c.debtPayoffMonths(1000, 0, 300)).toBe(4));
});

describe('otros', () => {
  it('realValue', () => expect(c.round2(c.realValue(1000, 2, 1))).toBe(980.39));
  it('emergencyFund', () => expect(c.emergencyFund(1000, 6, 1500)).toEqual({ target: 6000, missing: 4500, coverageMonths: 1.5 }));
  it('npv', () => expect(c.npv(10, [-1000, 1100])).toBeCloseTo(0, 9));
  it('irr', () => expect(c.round2(c.irr([-1000, 1100])!)).toBe(10));
  it('irr sin cambio de signo', () => expect(c.irr([100, 100])).toBeNull());
  it('convert', () => { expect(c.convert(100, 0.9)).toBe(90); expect(() => c.convert(1, 0)).toThrow(); });
});

describe('mortgage', () => {
  it('200,000 con 10% de inicial al 6% a 30 años: financia 180,000, cuota 1079.19', () => {
    const m = c.mortgage(200000, 10, 6, 30);
    expect(m.loan).toBe(180000);
    expect(m.down).toBe(20000);
    expect(c.round2(m.payment)).toBe(1079.19);
    expect(m.months).toBe(360);
    expect(c.round2(m.totalPaid)).toBe(c.round2(m.payment * 360));
    expect(c.round2(m.totalInterest)).toBe(c.round2(m.totalPaid - 180000));
  });
  it('coincide con loanPayment (hipoteca 200,000 al 6% a 30 años = 1199.10)', () => expect(c.round2(c.mortgage(200000, 0, 6, 30).payment)).toBe(1199.1));
  it('FECI suma 1 punto a la tasa', () => {
    const base = c.mortgage(100000, 20, 5, 20), feci = c.mortgage(100000, 20, 5, 20, true);
    expect(feci.effectiveRate).toBe(6);
    expect(c.round2(feci.payment)).toBe(c.round2(c.loanPayment(80000, 6, 240)));
    expect(feci.payment).toBeGreaterThan(base.payment);
  });
  it('seguros mensuales se suman a la cuota total', () => {
    const m = c.mortgage(100000, 20, 5, 20, false, 35);
    expect(c.round2(m.monthlyTotal)).toBe(c.round2(m.payment + 35));
    expect(m.totalExtras).toBe(35 * 240);
  });
  it('tasa 0', () => expect(c.mortgage(120000, 0, 0, 10).payment).toBe(1000));
  it('valida entradas', () => {
    expect(() => c.mortgage(0, 10, 5, 10)).toThrow();
    expect(() => c.mortgage(1000, 100, 5, 10)).toThrow();
    expect(() => c.mortgage(1000, -1, 5, 10)).toThrow();
    expect(() => c.mortgage(1000, 10, -5, 10)).toThrow();
    expect(() => c.mortgage(1000, 10, 5, 0)).toThrow();
    expect(() => c.mortgage(NaN, 10, 5, 10)).toThrow();
  });
});

describe('amortizationByYear', () => {
  it('suma de capital = monto, saldo final 0, intereses coinciden', () => {
    const m = c.mortgage(150000, 20, 6.5, 25);
    const ys = c.amortizationByYear(m.rows);
    expect(ys).toHaveLength(25);
    expect(c.round2(ys.reduce((s, y) => s + y.principal, 0))).toBe(c.round2(m.loan));
    expect(c.round2(ys.reduce((s, y) => s + y.interest, 0))).toBe(c.round2(m.totalInterest));
    expect(c.round2(ys[24].balance)).toBe(0);
  });
  it('plazo no múltiplo de 12 deja un último año parcial', () => expect(c.amortizationByYear(c.amortization(1000, 5, 18))).toHaveLength(2));
});

describe('retirementPlan', () => {
  const base = { age: 30, retireAge: 65, savings: 10000, monthly: 300, returnPct: 6, inflationPct: 2, targetIncome: 2000, retirementYears: 25 };
  it('saldo proyectado = futureValue de 420 meses', () => {
    const r = c.retirementPlan(base);
    expect(r.accMonths).toBe(420);
    expect(c.round2(r.projectedNominal)).toBe(c.round2(c.futureValue(10000, 300, 6, 420)));
    expect(c.round2(r.projectedReal)).toBe(c.round2(r.projectedNominal / Math.pow(1.02, 35)));
  });
  it('sin inflación ni rendimiento: capital necesario = ingreso × meses', () => {
    const r = c.retirementPlan({ ...base, returnPct: 0, inflationPct: 0, targetIncome: 1000, retirementYears: 20 });
    expect(r.neededReal).toBe(240000);
    expect(r.neededNominal).toBe(240000);
    expect(r.projectedNominal).toBe(10000 + 300 * 420);
  });
  it('el aporte requerido alcanza exactamente el capital necesario', () => {
    const r = c.retirementPlan(base);
    expect(c.round2(c.futureValue(10000, r.requiredMonthly, 6, 420))).toBe(c.round2(r.neededNominal));
  });
  it('brecha cero si el plan ya alcanza; aporte extra cero', () => {
    const r = c.retirementPlan({ ...base, monthly: 5000 });
    expect(r.onTrack).toBe(true);
    expect(r.gapNominal).toBe(0);
    expect(r.extraMonthly).toBe(0);
  });
  it('brecha positiva y aporte extra cuando no alcanza', () => {
    const r = c.retirementPlan({ ...base, monthly: 50 });
    expect(r.onTrack).toBe(false);
    expect(r.gapNominal).toBeGreaterThan(0);
    expect(c.round2(r.gapNominal)).toBe(c.round2(r.neededNominal - r.projectedNominal));
    expect(c.round2(r.gapReal * r.inflationFactor)).toBe(c.round2(r.gapNominal));
    expect(r.requiredMonthly).toBeGreaterThan(50);
  });
  it('el ingreso sostenible con el saldo proyectado reproduce el objetivo cuando el plan es justo', () => {
    const r0 = c.retirementPlan(base);
    const r = c.retirementPlan({ ...base, monthly: r0.requiredMonthly });
    expect(c.round2(r.sustainableIncomeReal)).toBe(2000);
  });
  it('rendimiento igual a inflación: tasa real 0', () => {
    const r = c.retirementPlan({ ...base, returnPct: 3, inflationPct: 3, retirementYears: 10 });
    expect(c.round2(r.neededReal)).toBe(2000 * 120);
  });
  it('objetivo 0: sin brecha ni aporte requerido', () => {
    const r = c.retirementPlan({ ...base, targetIncome: 0 });
    expect(r.requiredMonthly).toBe(0);
    expect(r.gapNominal).toBe(0);
  });
  it('valida entradas', () => {
    expect(() => c.retirementPlan({ ...base, retireAge: 30 })).toThrow();
    expect(() => c.retirementPlan({ ...base, retireAge: 20 })).toThrow();
    expect(() => c.retirementPlan({ ...base, monthly: -1 })).toThrow();
    expect(() => c.retirementPlan({ ...base, retirementYears: 0 })).toThrow();
    expect(() => c.retirementPlan({ ...base, savings: NaN })).toThrow();
  });
});
