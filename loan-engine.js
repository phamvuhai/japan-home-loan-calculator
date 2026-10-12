(function (root, factory) {
  "use strict";
  const api = factory();
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  root.HomeLoanEngine = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";
  const finite = (v, fallback = 0) => Number.isFinite(Number(v)) ? Number(v) : fallback;
  const roundYen = v => Math.round(v);
  function payment(principal, annualRate, months) {
    const p = finite(principal), n = finite(months);
    if (p <= 0 || n <= 0) return 0;
    const r = Math.max(0, finite(annualRate)) / 1200;
    return r === 0 ? p / n : p * r / (-Math.expm1(-n * Math.log1p(r)));
  }
  function payoffMonths(balance, annualRate, installment) {
    if (balance <= 0) return 0;
    const r = Math.max(0, finite(annualRate)) / 1200;
    if (r === 0) return Math.ceil(balance / installment - 1e-10);
    if (installment <= balance * r) return Infinity;
    return Math.ceil(-Math.log1p(-balance * r / installment) / Math.log1p(r) - 1e-10);
  }
  function simulate(config) {
    const principal = Math.max(0, finite(config.principal));
    const years = Math.floor(finite(config.years));
    const months = years * 12;
    const initialRate = Math.max(0, finite(config.annualRate));
    if (!principal || months < 1 || months > 600 || initialRate > 100) throw Error("Thông số khoản vay không hợp lệ.");
    const mode = config.mode === "reduce" ? "reduce" : "shorten";
    const stages = [{month: 1, rate: initialRate}];
    (config.stages || []).forEach(s => {
      const month = Math.floor(finite(s.month));
      const rate = finite(s.rate, -1);
      if (month > 1 && month <= months && rate >= 0 && rate <= 100) stages.push({month, rate});
    });
    stages.sort((a, b) => a.month - b.month);
    const stageRate = new Map(stages.map(s => [s.month, s.rate]));
    const prepayByMonth = new Map();
    (config.prepayments || []).forEach(p => {
      const month = Math.floor(finite(p.month));
      const amount = Math.max(0, finite(p.amount));
      if (month >= 1 && month < months && amount > 0) prepayByMonth.set(month, (prepayByMonth.get(month) || 0) + amount);
    });
    const rows = [];
    let balance = principal, annualRate = initialRate;
    let due = payment(principal, annualRate, months), maturity = months;
    let totalInterest = 0, totalPrepaid = 0, totalRegular = 0;
    for (let month = 1; month <= months && balance > 0.000001; month++) {
      if (stageRate.has(month)) {
        annualRate = stageRate.get(month);
        due = payment(balance, annualRate, Math.max(1, (mode === "shorten" ? maturity : months) - month + 1));
      }
      const interest = balance * annualRate / 1200;
      const principalPart = Math.max(0, Math.min(balance, due - interest));
      const regularPaid = interest + principalPart;
      balance = Math.max(0, balance - principalPart);
      const extra = Math.min(balance, prepayByMonth.get(month) || 0);
      balance = Math.max(0, balance - extra);
      totalRegular += regularPaid;
      totalInterest += interest;
      totalPrepaid += extra;
      rows.push({
        month, year: Math.ceil(month / 12), annualRate, payment: regularPaid,
        principal: principalPart, interest, prepayment: extra, balance
      });
      if (extra > 0 && balance > 0.000001) {
        if (mode === "reduce") {
          due = payment(balance, annualRate, months - month);
        } else {
          const remaining = payoffMonths(balance, annualRate, due);
          if (Number.isFinite(remaining)) maturity = Math.min(maturity, month + remaining);
        }
      }
    }
    const yearly = [];
    rows.forEach(r => {
      if (!yearly[r.year - 1]) yearly.push({year: r.year, principal: 0, interest: 0, prepayment: 0, paid: 0, balance: 0});
      const y = yearly[r.year - 1];
      y.principal += r.principal; y.interest += r.interest;
      y.prepayment += r.prepayment; y.paid += r.payment + r.prepayment; y.balance = r.balance;
    });
    return {
      principal, months: rows.length, originalMonths: months, years,
      firstPayment: rows[0]?.payment || 0,
      lastRegularPayment: rows[rows.length - 1]?.payment || 0,
      totalInterest, totalPrepaid, totalPaid: totalRegular + totalPrepaid,
      rows, yearly
    };
  }
  function purchase(config) {
    const priceMan = Math.max(0, finite(config.priceMan));
    const downMan = Math.max(0, finite(config.downMan));
    const loanMan = Math.max(0, priceMan - Math.min(priceMan, downMan));
    const brokerMan = config.broker ? (priceMan * 0.03 + 6) * 1.1 : 0;
    const bankFeeMan = loanMan * Math.max(0, finite(config.bankFeePercent)) / 100;
    const registryMan = priceMan * Math.max(0, finite(config.registryPercent)) / 100;
    const acquisitionTaxMan = Math.max(0, finite(config.acquisitionTaxMan));
    const initialInsuranceMan = Math.max(0, finite(config.initialInsuranceMan));
    const miscMan = Math.max(0, finite(config.miscMan));
    const feesMan = brokerMan + bankFeeMan + registryMan + acquisitionTaxMan + initialInsuranceMan + miscMan;
    return {
      priceMan, downMan, loanMan, ltv: priceMan ? loanMan / priceMan * 100 : 0,
      brokerMan, bankFeeMan, registryMan, acquisitionTaxMan, initialInsuranceMan,
      miscMan, feesMan, upfrontMan: Math.min(priceMan, downMan) + feesMan
    };
  }
  function affordability({annualIncomeMan, monthlyOtherDebtYen, monthlyPaymentYen, annualTaxMan, annualInsuranceMan, maintenanceMan}) {
    const income = Math.max(0, finite(annualIncomeMan)) * 10000;
    const salaryMonthly = income / 12;
    const debts = Math.max(0, finite(monthlyOtherDebtYen));
    const mortgage = Math.max(0, finite(monthlyPaymentYen));
    const propertyMonthly = (Math.max(0, finite(annualTaxMan)) + Math.max(0, finite(annualInsuranceMan))) * 10000 / 12 +
      Math.max(0, finite(maintenanceMan)) * 10000;
    return {
      salaryMonthly, mortgage, debts, propertyMonthly,
      dti: salaryMonthly ? (mortgage + debts) / salaryMonthly * 100 : 0,
      housingRatio: salaryMonthly ? (mortgage + propertyMonthly) / salaryMonthly * 100 : 0,
      totalCashMonthly: mortgage + propertyMonthly,
      maxLoanPaymentAt35: Math.max(0, salaryMonthly * 0.35 - debts)
    };
  }
  return {payment, simulate, purchase, affordability, roundYen};
});
