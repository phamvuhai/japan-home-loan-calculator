/*
 * HomeLoan JP v4.5 — display-only FX conversion.
 * Loan engine, saved inputs and bank underwriting remain denominated in JPY.
 */
(function(root){
 "use strict";
 const STORE="home-loan-jp-currency", CACHE="home-loan-jp-fx-rates-v1";
 const currencies=new Set(["JPY","VND","USD","EUR"]);
 const TTL=12*60*60*1000, MAX_AGE=7*24*60*60*1000;
 let selected="JPY",snapshot=null,main=null,advance={},bankLoan=null;
 const id=k=>document.getElementById(k);
 const lg=()=>root.HomeLoanI18n?.language||"vi";
 const str=(vi,ja,en)=>lg()==="ja"?ja:lg()==="en"?en:vi;
 const locale=()=>root.HomeLoanI18n?.locale()||"vi-VN";
 const fmt=(v,code=selected)=>{
   if(!Number.isFinite(v))return "—";
   try{return new Intl.NumberFormat(locale(),{style:"currency",currency:code,minimumFractionDigits:0,maximumFractionDigits:code==="VND"||code==="JPY"?0:2}).format(v)}
   catch(_){return v.toLocaleString(locale())+" "+code}
 };
 function safeSnapshot(raw){
  if(!raw||raw.schemaVersion!==1||raw.base!=="JPY"||!raw.rates)return null;
  if(["VND","USD","EUR"].some(k=>!Number.isFinite(Number(raw.rates[k]))||Number(raw.rates[k])<=0||!/^\d{4}-\d{2}-\d{2}$/.test(String(raw.rateDates?.[k]||""))))return null;
  const stamp=Date.parse(raw.checkedAt);
  if(!Number.isFinite(stamp)||stamp>Date.now()+120000)return null;
  return {schemaVersion:1,base:"JPY",rates:{JPY:1,VND:Number(raw.rates.VND),USD:Number(raw.rates.USD),EUR:Number(raw.rates.EUR)},rateDates:{VND:raw.rateDates.VND,USD:raw.rateDates.USD,EUR:raw.rateDates.EUR},checkedAt:raw.checkedAt,source:"Frankfurter",sourceUrl:"https://frankfurter.dev/"};
 }
 function readCache(){
  try{const c=safeSnapshot(JSON.parse(localStorage.getItem(CACHE)||"null"));if(c)return c}catch(_){}
  return null;
 }
 try{
  const saved=localStorage.getItem(STORE);
  if(currencies.has(saved))selected=saved;
 }catch(_){}
 snapshot=readCache();
 const rate=()=>selected==="JPY"?1:snapshot?.rates?.[selected];
 const valid=()=>Number.isFinite(rate())&&rate()>0;
 const converted=yen=>valid()&&Number.isFinite(yen)?fmt(yen*rate()):"—";
 function show(el,visible){if(el)el.hidden=!visible;}
 function text(k,value){const el=id(k);if(el)el.textContent=value;}
 function stateLabel(){
  if(selected==="JPY")return "";
  if(!snapshot||!valid())return str("Chưa có tỷ giá xác minh · Chỉ hiển thị JPY","有効な為替レートがありません・円の金額のみ表示","Rate unavailable · JPY amounts only");
  const age=Date.now()-Date.parse(snapshot.checkedAt);
  const date=snapshot.rateDates[selected];
  const delayed=age>TTL||!Number.isFinite(Date.parse(date+"T00:00:00Z"))||(Date.now()-Date.parse(date+"T00:00:00Z")>MAX_AGE);
  return (delayed?str("Tỷ giá đã lưu · ","保存済みレート・","Saved rate · "):str("Tỷ giá tham khảo · ","参考為替レート・","Indicative rate · "))
    + "1 JPY ≈ "+fmt(rate(),selected)+" · "+date;
 }
 function meta(){
  text("fx-status",stateLabel());text("fx-sticky-status",selected==="JPY"?"":str("Ước tính theo tỷ giá tham khảo","参考為替レートによる概算","Indicative FX conversion"));
  const link=id("fx-source");if(link)link.hidden=selected==="JPY";
  const alert=id("fx-data-alert");if(alert){alert.hidden=selected==="JPY";alert.textContent=valid()?str("Chỉ dùng để tham khảo; tỷ giá chuyển tiền thực tế có thể khác.","参考値です。銀行の実際の両替・送金レートとは異なる場合があります。","For reference only; bank transfer and exchange rates may differ."):stateLabel();}
 }
 function decorateAnnual(){
  const tbody=id("schedule-body");
  if(!tbody)return;
  tbody.querySelectorAll(".fx-table-sub").forEach(n=>n.remove());
  if(selected==="JPY"||!valid()||!main?.result)return;
  const rows=main.result.yearsData||[];
  for(const tr of tbody.querySelectorAll("tr")){
   const year=Number(tr.id?.replace("schedule-year-",""));
   const r=rows.find(x=>x.year===year);if(!r)continue;
   const nums=[r.principal,r.interest,r.extra,r.paid,r.balance];
   Array.from(tr.cells).slice(1).forEach((td,i)=>{
    const el=document.createElement("small");el.className="fx-table-sub";
    el.textContent="≈ "+converted(nums[i]);td.append(el);
   });
  }
 }
 function decorateAdvanced(){
  document.querySelectorAll(".fx-advanced-inline").forEach(el=>el.remove());
  if(selected==="JPY"||!valid())return;
  for(const [key,amount] of Object.entries(advance)){
   const target=id(key);
   if(!target||!Number.isFinite(amount))continue;
   const sub=document.createElement("small");sub.className="fx-advanced-inline";
   sub.textContent="≈ "+converted(amount);target.insertAdjacentElement("afterend",sub);
  }
 }
 function refreshChart(){
  const el=id("fx-chart");if(!el)return;
  const year=Number(id("chart-year-select")?.value||id("chart-year-label")?.textContent.match(/\d+/)?.[0]);
  const row=main?.result?.yearsData?.find(x=>x.year===year);
  show(el,selected!=="JPY"&&!!row);
  if(row)el.textContent=valid()?str("Năm ","年 ","Year ")+year+" · "+str("Gốc ","元金 ","Principal ")+converted(row.principal)+" · "+str("Lãi ","利息 ","Interest ")+converted(row.interest):stateLabel();
 }
 function refreshCalculator(){
  const active=selected!=="JPY";
  ["fx-result","fx-sticky","fx-principal","fx-chart"].forEach(k=>show(id(k),active));
  document.querySelectorAll("[data-fx-currency-code]").forEach(n=>n.textContent=selected);
  if(active&&main?.result){
   text("fx-monthly",converted(main.result.monthly));
   text("fx-interest",converted(main.result.totalInterest));
   text("fx-total",converted(main.result.totalPaid));
   text("fx-sticky-monthly",converted(main.result.monthly));
   text("fx-loan",converted(main.result.principal));
  }else if(active){
   ["fx-monthly","fx-interest","fx-total","fx-sticky-monthly","fx-loan"].forEach(k=>text(k,"—"));
  }
  meta();decorateAnnual();decorateAdvanced();refreshChart();
 }
 function refreshBank(){
  const active=selected!=="JPY";
  show(id("fx-bank-summary"),active);
  if(active)text("fx-bank-loan",Number.isFinite(bankLoan)?converted(bankLoan):"—");
  for(const el of document.querySelectorAll("[data-fx-yen]")){
   el.hidden=!active;
   el.textContent=active?str("Quy đổi: ","換算額：","Converted: ")+converted(Number(el.dataset.fxYen)):"";
  }
  meta();
 }
 function refresh(){refreshCalculator();refreshBank()}
 function setCurrency(code){
  if(!currencies.has(code)||code===selected)return;
  selected=code;
  try{localStorage.setItem(STORE,selected)}catch(_){}
  document.querySelectorAll("[data-currency-select]").forEach(el=>el.value=selected);
  refresh();
  document.dispatchEvent(new CustomEvent("home-loan-currency-change",{detail:{currency:selected}}));
  if(selected!=="JPY"&&!snapshot)load();
 }
 async function load(){
  let s=null;
  try{
   const response=await fetch("/api/fx",{cache:"no-cache"});
   if(!response.ok)throw Error("FX service unavailable");
   s=safeSnapshot(await response.json());
   if(!s)throw Error("Invalid FX response");
  }catch(_){
   // Allows GitHub Pages hosting and survives temporary Vercel endpoint failures.
   try{
    const r=await fetch("https://api.frankfurter.dev/v2/rates?base=JPY&quotes=VND,USD,EUR");
    if(!r.ok)throw Error("Upstream unavailable");
    const rows=await r.json(),rates={JPY:1},rateDates={};
    for(const item of rows)if(["VND","USD","EUR"].includes(item.quote)&&item.base==="JPY"){rates[item.quote]=Number(item.rate);rateDates[item.quote]=item.date;}
    s=safeSnapshot({schemaVersion:1,base:"JPY",rates,rateDates,checkedAt:new Date().toISOString()});
   }catch(_){}
  }
  if(s){snapshot=s;try{localStorage.setItem(CACHE,JSON.stringify(s))}catch(_){}}
  refresh();
 }
 function init(){
  document.querySelectorAll("[data-currency-select]").forEach(el=>{
   el.value=selected;
   el.addEventListener("change",()=>setCurrency(el.value));
  });
  document.addEventListener("home-loan-language-change",refresh);
  refresh();
  // Respect the rate provider's daily publishing schedule, avoid per-change calls.
  if(!snapshot||Date.now()-Date.parse(snapshot.checkedAt)>TTL)load();
 }
 root.HomeLoanFX={
  get currency(){return selected;},get exchangeRate(){return rate();},get rateSnapshot(){return snapshot;},
  formatJPY:fmt,convert:converted,setCurrency,refresh,refreshChart,refreshCalculator,refreshBank,
  setCalculator(data){main=data;refreshCalculator()},
  setAdvanced(data){advance=data||{};decorateAdvanced()},
  setBankLoan(yen){bankLoan=yen;refreshBank()},
  csvRate(){return selected!=="JPY"&&valid()?{currency:selected,rate:rate(),rateDate:snapshot.rateDates[selected]}:null}
 };
 if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});else init();
})(window);
