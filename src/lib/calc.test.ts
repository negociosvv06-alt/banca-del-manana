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
