(function(root){
"use strict";
const round=v=>Math.round((v+Number.EPSILON)*100)/100;
const num=(v,def=0)=>{const n=Number(v);return Number.isFinite(n)?n:def};
const yenFromMan=v=>num(v)*10000;
function monthlyPayment(principal, annualRate, months){
 if(principal<=0||months<=0)return 0;
 const r=annualRate/1200;
 return Math.abs(r)<1e-12?principal/months:principal*r/(-Math.expm1(-months*Math.log1p(r)));
}
function normalizedChanges(changes,initialRate,months){
 const list=[{month:1,rate:num(initialRate)}];
 (Array.isArray(changes)?changes:[]).forEach(x=>{
  const month=Math.floor(num(x.month,0)), rate=num(x.rate,NaN);
  if(month>=2&&month<=months&&Number.isFinite(rate)&&rate>=0&&rate<=100)list.push({month,rate});
 });
 list.sort((a,b)=>a.month-b.month);
 return list.filter((x,i)=>i===0||x.month!==list[i-1].month);
}
function simulate(opt){
 const principal=yenFromMan(opt.loanMan), years=Math.floor(num(opt.years)), maxMonths=years*12;
 const initialRate=num(opt.rate);
 if(!(principal>0&&principal<=200000000&&years>=1&&years<=50&&initialRate>=0&&initialRate<=100))
  throw Error("Số tiền vay phải trong (0, 20.000] man; thời hạn 1–50 năm, lãi suất 0–100%.");
 const rateChanges=normalizedChanges(opt.rateChanges,initialRate,maxMonths);
 const extras=(Array.isArray(opt.prepayments)?opt.prepayments:[])
  .map(x=>({month:Math.floor(num(x.month)),amount:yenFromMan(x.amountMan),mode:x.mode==="reduce-payment"?"reduce-payment":"reduce-term"}))
  .filter(x=>x.month>=1&&x.month<=maxMonths&&x.amount>0).sort((a,b)=>a.month-b.month);
 const rows=[],yearsData=[];
 let balance=principal,scheduled=monthlyPayment(balance,initialRate,maxMonths),activeRate=initialRate;
 let totalInterest=0,totalExtra=0,totalPaid=0,totalScheduled=0,iChange=0,iExtra=0,firstMonthly=scheduled;
 let recalculations=[];
 for(let m=1;m<=maxMonths&&balance>0.00001;m++){
  if(iChange<rateChanges.length&&rateChanges[iChange].month===m){
    activeRate=rateChanges[iChange].rate;
    scheduled=monthlyPayment(balance,activeRate,maxMonths-m+1);
    recalculations.push({month:m,monthly:scheduled,rate:activeRate,reason:"rate"});
    iChange++;
  }
  const interest=balance*activeRate/1200;
  const regular=Math.min(balance+interest,scheduled);
  const principalPart=Math.min(balance,Math.max(0,regular-interest));
  balance=Math.max(0,balance-principalPart);
  let extra=0,reducePayment=false;
  while(iExtra<extras.length&&extras[iExtra].month===m){
   const e=extras[iExtra++];
   const a=Math.min(balance,e.amount);
   balance=Math.max(0,balance-a);
   extra+=a;
   if(e.mode==="reduce-payment")reducePayment=true;
  }
  const y=Math.ceil(m/12);
  if(!yearsData[y-1])yearsData.push({year:y,principal:0,interest:0,extra:0,paid:0,balance:0});
  const yr=yearsData[y-1];
  yr.principal+=principalPart+extra;yr.interest+=interest;yr.extra+=extra;
  yr.paid+=regular+extra;yr.balance=balance;
  totalInterest+=interest;totalExtra+=extra;totalPaid+=regular+extra;totalScheduled+=regular;
  rows.push({month:m,year:y,rate:activeRate,scheduled:regular,principal:principalPart,interest,extra,paid:regular+extra,balance});
  if(reducePayment&&balance>0.00001){
    scheduled=monthlyPayment(balance,activeRate,maxMonths-m);
    recalculations.push({month:m+1,monthly:scheduled,rate:activeRate,reason:"reduce-payment"});
  }
 }
 const paidOffMonth=rows.length;
 return {principal,years,months:maxMonths,monthly:firstMonthly,paymentAfterChanges:scheduled,totalInterest,totalExtra,totalPaid,totalScheduled,paidOffMonth,interestShare:totalPaid?totalInterest/totalPaid*100:0,rows,yearsData,recalculations};
}
function fees(opt,propertyMan,bankFeePercent=0,bankFeeMan=0){
 const price=yenFromMan(propertyMan), pct=clamp(num(opt.closingPercent),0,30)/100;
 const registration=yenFromMan(opt.registrationMan), insurance=yenFromMan(opt.insuranceMan);
 const taxes=yenFromMan(opt.taxesMan), other=yenFromMan(opt.otherMan);
 const agency=opt.includeBroker?Math.max(0,(price*.03+60000)*1.1):0;
 const bank=Math.max(0,price*0)+Math.max(0,num(bankFeePercent))/100*yenFromMan(num(opt.loanMan))+yenFromMan(bankFeeMan);
 const general=price*pct;
 return {agency,bank,general,registration,insurance,taxes,other,total:agency+bank+general+registration+insurance+taxes+other};
}
const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
function affordability(grossAnnualMan,monthlyOtherDebtMan,monthlyLoanYen,thresholdPercent,upkeepMan=0){
 const income=yenFromMan(grossAnnualMan),other=yenFromMan(monthlyOtherDebtMan),upkeep=yenFromMan(upkeepMan);
 const incomeMonthly=income/12, debt=monthlyLoanYen+other,ratio=incomeMonthly>0?debt/incomeMonthly*100:Infinity;
 const budget=incomeMonthly*clamp(num(thresholdPercent,30),1,100)/100-other;
 return {incomeMonthly,monthlyDebt:debt,ratio,thresholdPercent,monthlyCapacity:Math.max(0,budget),housingCashflow:monthlyLoanYen+upkeep,underThreshold:ratio<=thresholdPercent};
}
function maximumLoan(grossAnnualMan,otherDebtMan,rate,years,thresholdPercent){
 const monthly=yenFromMan(grossAnnualMan)/12*clamp(num(thresholdPercent,30),1,100)/100-yenFromMan(otherDebtMan);
 const months=num(years)*12,r=num(rate)/1200;
 if(monthly<=0||months<=0)return 0;
 return (Math.abs(r)<1e-12?monthly*months:monthly*(-Math.expm1(-months*Math.log1p(r)))/r)/10000;
}
function compareBanks(base,banks){
 return banks.map(b=>{
  const result=simulate({...base,rate:num(b.rate),rateChanges:b.rateChanges||base.rateChanges||[]});
  const bankFees=yenFromMan(b.feeMan)+result.principal*num(b.feePercent)/100;
  return {name:b.name||"Ngân hàng",rate:num(b.rate),fee:bankFees,monthly:result.monthly,interest:result.totalInterest,repayment:result.totalPaid,cost:result.totalPaid+bankFees,payoff:result.paidOffMonth,result};
 });
}
const api={monthlyPayment,simulate,fees,affordability,maximumLoan,compareBanks,yenFromMan};
if(typeof module!=="undefined"&&module.exports)module.exports=api;
root.LoanCore=api;
})(typeof window!=="undefined"?window:globalThis);
