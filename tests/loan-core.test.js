"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const C = require("../calculator-core.js");
const base = {loanMan:3200,rate:3,years:35};
const yenClose=(a,b,tolerance=0.05)=>assert.ok(Math.abs(a-b)<tolerance,`Expected ${a} approximately ${b}`);
test("fixed rate: 35 years, 420 months, principal + interest accounting",()=>{
 const r=C.simulate(base);
 assert.equal(r.paidOffMonth,420);
 yenClose(r.totalPaid,r.principal+r.totalInterest);
 yenClose(r.rows.at(-1).balance,0);
});
test("zero interest: exact capital repayment",()=>{
 const r=C.simulate({loanMan:1000,rate:0,years:10});
 assert.equal(r.totalInterest,0);
 assert.equal(r.paidOffMonth,120);
 yenClose(r.totalPaid,10_000_000);
});
test("lump-sum payment shortens the loan and saves more interest",()=>{
 const baseline=C.simulate(base);
 const shorter=C.simulate({...base,prepayments:[{month:60,amountMan:500,mode:"reduce-term"}]});
 const lowerMonthly=C.simulate({...base,prepayments:[{month:60,amountMan:500,mode:"reduce-payment"}]});
 assert.ok(shorter.paidOffMonth<baseline.paidOffMonth);
 assert.equal(lowerMonthly.paidOffMonth,baseline.paidOffMonth);
 assert.ok(shorter.totalInterest<lowerMonthly.totalInterest);
 assert.ok(lowerMonthly.totalInterest<baseline.totalInterest);
 assert.ok(lowerMonthly.rows[60].scheduled<lowerMonthly.rows[59].scheduled);
});
test("changing rates uses new rate from defined month",()=>{
 const fixed=C.simulate(base);
 const variable=C.simulate({...base,rateChanges:[{month:61,rate:5}]});
 assert.equal(variable.rows[60].rate,5);
 assert.ok(variable.totalInterest>fixed.totalInterest);
});
test("term reduction persists when the variable rate later resets",()=>{
 const rates=[{month:121,rate:4.5}];
 const variable=C.simulate({...base,rateChanges:rates});
 const shorter=C.simulate({...base,rateChanges:rates,prepayments:[{month:60,amountMan:500,mode:"reduce-term"}]});
 assert.ok(shorter.paidOffMonth<420);
 assert.ok(shorter.totalInterest<variable.totalInterest);
});
test("payment schedule never creates negative outstanding principal",()=>{
 const r=C.simulate({...base,rateChanges:[{month:70,rate:4}],prepayments:[{month:60,amountMan:500,mode:"reduce-term"},{month:120,amountMan:100,mode:"reduce-payment"}]});
 assert.ok(r.rows.every(row=>row.balance>=0));
 yenClose(r.rows.at(-1).balance,0);
 yenClose(r.totalInterest+r.principal,r.totalPaid);
});
test("fees include optional brokerage and bank percentage",()=>{
 const a=C.fees({loanMan:3200,closingPercent:0,registrationMan:20,insuranceMan:10,taxesMan:0,otherMan:0,includeBroker:true},3400,2.2,0);
 const b=C.fees({loanMan:3200,closingPercent:0,registrationMan:20,insuranceMan:10,taxesMan:0,otherMan:0,includeBroker:false},3400,2.2,0);
 assert.ok(a.agency>0);
 assert.ok(a.total>b.total);
});
test("higher input rate leads to higher bank cost if fees equal",()=>{
 const [a,b]=C.compareBanks(base,[{name:"A",rate:2,feePercent:0,feeMan:0},{name:"B",rate:3,feePercent:0,feeMan:0}]);
 assert.ok(a.cost<b.cost);
});
test("DTI and simulated borrowing capacity are positive",()=>{
 const r=C.simulate(base), a=C.affordability(530,0,r.monthly,30,2);
 assert.ok(a.ratio>0);
 assert.ok(a.housingCashflow>r.monthly);
 assert.ok(C.maximumLoan(530,0,4.5,35,30)>0);
});
