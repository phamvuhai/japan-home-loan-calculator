(function(){
"use strict";
const C=window.LoanCore, $=id=>document.getElementById(id);
const I=()=>window.HomeLoanI18n;
const lang=()=>I()?.language||"vi";
const tr=s=>I()?.t(s)||s;
const ls=(vi,ja,en)=>lang()==="ja"?ja:lang()==="en"?en:vi;
const money=n=>I()?I().money(n):Number.isFinite(n)?Math.round(n).toLocaleString("vi-VN")+" ¥":"—";
const man=n=>I()?I().man(n):Number.isFinite(n)?n.toLocaleString("vi-VN",{maximumFractionDigits:2})+" man":"—";
const pct=n=>Number.isFinite(n)?(I()?I().number(n,{maximumFractionDigits:1}):n.toLocaleString("vi-VN",{maximumFractionDigits:1}))+"%":"—";
const val=(id,def=0)=>{const e=$(id);if(!e)return def;const n=Number(e.value);return e.value.trim()!==""&&Number.isFinite(n)?n:def};
const el=(tag,cls)=>{const e=document.createElement(tag);if(cls)e.className=cls;return e};
function newEvent(type,data={}){
 const node=el("div","event-row");node.dataset.kind=type;
 if(type==="early"){
  node.innerHTML='<div class="event-card-head"><strong class="event-card-title">Lần trả trước</strong><button type="button" class="remove-event" aria-label="Xóa lần trả trước">×</button></div><div class="event-fields"><label class="event-year">Năm trả trước<input aria-label="Năm trả trước" type="number" data-key="year" min="1" max="50" step="1" inputmode="numeric"></label><label class="event-amount">Số tiền (man)<input aria-label="Số tiền trả trước" type="number" data-key="amount" min="1" step="10" inputmode="decimal"></label><label class="event-mode">Phương thức trả trước<select aria-label="Phương thức trả trước" data-key="mode"><option value="reduce-term">Rút ngắn thời gian vay</option><option value="reduce-payment">Giảm tiền trả hàng tháng</option></select></label></div>';
  node.querySelector('[data-key="year"]').value=data.year||5;
  node.querySelector('[data-key="amount"]').value=data.amount||500;
  node.querySelector('[data-key="mode"]').value=data.mode||"reduce-term";
 }else{
  node.innerHTML='<label>Bắt đầu từ năm<input aria-label="Lãi suất mới bắt đầu từ năm" type="number" data-key="year" min="2" max="50" step="1"></label><label>Lãi suất mới (%/năm)<input aria-label="Lãi suất mới mỗi năm" type="number" data-key="rate" min="0" max="100" step="0.01" inputmode="decimal"></label><button type="button" class="remove-event" aria-label="Xóa lần đổi lãi suất">×</button>';
  node.querySelector('[data-key="year"]').value=data.year||6;
  node.querySelector('[data-key="rate"]').value=data.rate??4.5;
 }
 $(type==="early"?"early-events":"rate-events").append(node);
 if(type==="early")syncPrepaymentCards();
}
function syncPrepaymentCards(){
 const cards=Array.from(document.querySelectorAll('[data-kind="early"]'));
 const modesByYear=new Map();
 cards.forEach((card,i)=>{
  const title=card.querySelector(".event-card-title");
  if(title)title.textContent="Lần trả trước #"+(i+1);
  const remove=card.querySelector(".remove-event");
  if(remove)remove.setAttribute("aria-label","Xóa lần trả trước #"+(i+1));
  const yearInput=card.querySelector('[data-key="year"]');
  const year=Number(yearInput?.value);
  if(!yearInput || yearInput.value.trim()==="" || !Number.isInteger(year) || year<1 || year>50)return;
  const mode=card.querySelector('[data-key="mode"]')?.value;
  if(!modesByYear.has(year))modesByYear.set(year,new Set());
  modesByYear.get(year).add(mode);
 });
 const mixed=Array.from(modesByYear.entries()).filter(([,modes])=>modes.size>1).map(([year])=>year).sort((a,b)=>a-b);
 const warning=$("prepay-method-warning");
 if(warning){
  warning.hidden=mixed.length===0;
  warning.textContent=mixed.length
   ?ls("Năm "+mixed.join(", ")+" có cả hai phương thức trả trước. Theo cách tính hiện tại, hệ thống ưu tiên Giảm tiền trả hàng tháng. Hãy chọn cùng một phương thức cho mỗi năm để tránh nhầm lẫn.","同じ年（"+mixed.join("、")+"年目）に異なる繰上返済方式が設定されています。現在の計算では返済額軽減型が優先されます。誤解を避けるため同じ年は同一方式を選択してください。","Both repayment methods are selected for year(s) "+mixed.join(", ")+". The calculation prioritizes reducing monthly payments. Choose one method per year.")
   :"";
 }
}
function read(){
 const prepayments=Array.from(document.querySelectorAll('[data-kind="early"]')).map(r=>({
  month:Number(r.querySelector('[data-key="year"]').value)*12,
  amountMan:Number(r.querySelector('[data-key="amount"]').value),
  mode:r.querySelector('[data-key="mode"]').value
 }));
 const rateChanges=$("rate-mode")?.value==="variable"?Array.from(document.querySelectorAll('[data-kind="rate"]')).map(r=>({
  month:(Number(r.querySelector('[data-key="year"]').value)-1)*12+1,
  rate:Number(r.querySelector('[data-key="rate"]').value)
 })):[];
 return {prepayments,rateChanges};
}
// When a page is loaded with an older HTML/JS version (browser/CDN cache),
// optional analytics must not prevent the core monthly repayment from rendering.
// Keep the DOM contract explicit so missing nodes are observable in the console.
const RESULT_IDS=[
 "prepay-saved","prepay-paid-off","prepay-extra","prepay-years","schedule-label",
 "ltv-result","cash-down","loan-gap","fee-total","cash-needed","total-housing",
 "purchase-warning","fee-breakdown","debt-ratio","monthly-budget",
 "housing-monthly","max-estimated","afford-status","compare-difference",
 "payment-milestones",
 "bank-a-monthly","bank-a-interest","bank-a-cost","bank-a-payoff",
 "bank-b-monthly","bank-b-interest","bank-b-cost","bank-b-payoff"
];
let missingUiReported=false;
function availableResults(){
 const missing=RESULT_IDS.filter(id=>!$(id));
 if(missing.length){
  if(!missingUiReported){
   console.warn("[HomeLoan JP] Missing advanced UI elements; keeping base calculation available:",missing.join(", "));
   missingUiReported=true;
  }
  return false;
 }
 missingUiReported=false;
 return true;
}
function render(base,simulation){
 if(!availableResults())return;
 const standard=C.simulate({...base,prepayments:[]});
 const saved=standard.totalInterest-simulation.totalInterest;
 $("prepay-saved").textContent=money(saved);
 $("prepay-paid-off").textContent=ls("Tháng "+simulation.paidOffMonth+" / "+simulation.months,simulation.paidOffMonth+" / "+simulation.months+"か月目","Month "+simulation.paidOffMonth+" of "+simulation.months);
 $("prepay-extra").textContent=money(simulation.totalExtra);
 $("prepay-years").textContent=(I()?I().number(simulation.paidOffMonth/12,{maximumFractionDigits:1}):(simulation.paidOffMonth/12).toLocaleString("vi-VN",{maximumFractionDigits:1}))+ls(" năm","年"," years");
 syncPrepaymentCards();
 const preview=$("prepay-quick-summary");
 if(preview){
  preview.textContent=simulation.totalExtra>0
   ?ls("Trả thêm ","繰上返済額 ","Extra repayment ")+money(simulation.totalExtra)+ls(" · Tiết kiệm lãi "," · 利息軽減額 "," · Interest saved ")+money(saved)+ls(" · Tất toán sau "," · 完済まで "," · Paid off in ")+(I()?I().number(simulation.paidOffMonth/12,{maximumFractionDigits:1}):(simulation.paidOffMonth/12).toLocaleString("vi-VN",{maximumFractionDigits:1}))+ls(" năm","年"," years")
   :tr("Chưa thêm khoản trả trước. Mở mục trên để thiết lập.");
 }
 $("schedule-label").textContent=read().rateChanges.length?ls("Lãi suất thay đổi theo các mốc đã nhập","指定した時期に金利を変更","Rate changes at selected milestones"):ls("Lãi suất giữ nguyên trong kỳ vay","借入期間中は同一金利で試算","Rate remains constant throughout the loan");
 const p=val("property-price",base.loanMan),deposit=val("down-payment"),ltv=p>0?base.loanMan/p*100:Infinity;
 $("ltv-result").textContent=pct(ltv);
 $("cash-down").textContent=money(C.yenFromMan(deposit));
 $("loan-gap").textContent=money(C.yenFromMan(p-deposit-base.loanMan));
 const feeOpts={loanMan:base.loanMan,closingPercent:val("closing-pct"),registrationMan:val("registration"),insuranceMan:val("insurance"),taxesMan:val("taxes"),otherMan:val("other"),includeBroker:$("include-broker").checked};
 const f=C.fees(feeOpts,p,val("bank-fee-pct"),val("bank-fee-man"));
 $("fee-total").textContent=money(f.total);
 const requiredOwnCash=Math.max(0,p-base.loanMan)*10000;
 $("cash-needed").textContent=money(requiredOwnCash+f.total);
 $("total-housing").textContent=money(simulation.totalPaid+requiredOwnCash+f.total);
 const gap=p-deposit-base.loanMan;
 $("purchase-warning").textContent=Math.abs(gap)>0.01
  ?ls("Giá nhà, tiền tự có và khoản vay đang lệch ","物件価格・頭金・借入額の差額は ","Price, down payment and loan differ by ")+man(Math.abs(gap))+ls(". Dự toán tiền mặt tính theo giá nhà trừ khoản vay, không chỉ theo khoản đặt cọc đã nhập."," です。必要現金は物件価格と借入額の差額に基づきます。",". Required cash is calculated from price minus loan, not only the entered deposit.")
  :ls("Giá nhà = khoản vay + tiền tự có. Chi phí dự kiến chưa tính phí duy trì qua các năm.","物件価格＝借入額＋頭金です。継続的な維持費は含んでいません。","Property price equals loan plus down payment. Ongoing upkeep is excluded.");
 $("fee-breakdown").textContent=ls("Phí ngân hàng ","銀行手数料 ","Bank fees ")+money(f.bank)+ls(" · Môi giới "," · 仲介手数料 "," · Brokerage ")+money(f.agency)+ls(" · Phí khác "," · その他 "," · Other fees ")+money(f.total-f.bank-f.agency);
 const income=val("income"),other=val("other-debt"),upkeep=val("upkeep"),threshold=val("debt-threshold",30);
 const a=C.affordability(income,other,simulation.monthly,threshold,upkeep);
 const stress=C.maximumLoan(income,other,val("stress-rate"),base.years,threshold);
 $("debt-ratio").textContent=pct(a.ratio);
 $("monthly-budget").textContent=money(a.monthlyCapacity);
 $("housing-monthly").textContent=money(a.housingCashflow);
 $("max-estimated").textContent=man(stress);
 $("afford-status").textContent=!Number.isFinite(a.ratio)
   ?ls("Hãy nhập thu nhập hợp lệ","有効な年収を入力してください","Enter valid income")
   :a.underThreshold
     ?ls("Trong ngưỡng mô phỏng (","仮定の返済負担率以内（","Within estimated threshold (")+threshold+ls("%)","％）","%)")
     :ls("Vượt ngưỡng mô phỏng (","仮定の返済負担率を超過（","Above estimated threshold (")+threshold+ls("%)","％）","%)");
 $("afford-status").className="state-label "+(a.underThreshold?"good":"warn");
 const banks=C.compareBanks({...base,prepayments:read().prepayments,rateChanges:[]},[
  {name:($("bank-a-name").value||"Ngân hàng A"),rate:val("bank-a-rate"),feePercent:val("bank-a-fee-pct"),feeMan:val("bank-a-fee")},
  {name:($("bank-b-name").value||"Ngân hàng B"),rate:val("bank-b-rate"),feePercent:val("bank-b-fee-pct"),feeMan:val("bank-b-fee")}
 ]);
 ["a","b"].forEach((s,i)=>{
  const b=banks[i];$("bank-"+s+"-monthly").textContent=money(b.monthly);
  $("bank-"+s+"-interest").textContent=money(b.interest);
  $("bank-"+s+"-cost").textContent=money(b.cost);
  $("bank-"+s+"-payoff").textContent=b.payoff+ls(" tháng","か月"," months");
 });
 const delta=banks[0].cost-banks[1].cost;
 $("compare-difference").textContent=Math.abs(delta)<1?ls("Hai phương án có chi phí tương đương","両プランの総費用はほぼ同じです","Both options have similar total costs"):(delta<0?banks[0].name:banks[1].name)+ls(" thấp hơn "," の総費用が "," costs ")+money(Math.abs(delta))+ls(" (gốc, lãi và phí ngân hàng)."," 少なくなります（元利返済＋銀行手数料）。"," less (repayment and bank fees).");
 // Show rate and payment events when the user is modeling them.
 $("payment-milestones").replaceChildren();
 const seen=new Set();
 simulation.recalculations.forEach(r=>{
  if(r.month===1||seen.has(r.month))return;
  seen.add(r.month);
  const item=el("span","milestone");
  item.textContent=ls("Từ tháng ","第","From month ")+r.month+ls(": ","か月目から：",": ")+money(r.monthly)+ls("/tháng · ","／月 · ","/month · ")+r.rate+"%";
  $("payment-milestones").append(item);
 });
 if(!seen.size)$("payment-milestones").textContent=ls("Không có kỳ điều chỉnh tiền trả.","返済額の変更予定はありません。","No payment recalculations scheduled.");
 window.HomeLoanFX?.setAdvanced({
  "prepay-saved":saved,"prepay-extra":simulation.totalExtra,
  "cash-down":C.yenFromMan(deposit),"loan-gap":C.yenFromMan(p-deposit-base.loanMan),
  "fee-total":f.total,"cash-needed":requiredOwnCash+f.total,
  "total-housing":simulation.totalPaid+requiredOwnCash+f.total,
  "monthly-budget":a.monthlyCapacity,"housing-monthly":a.housingCashflow,
  "max-estimated":C.yenFromMan(stress),
  "bank-a-monthly":banks[0].monthly,"bank-a-interest":banks[0].interest,"bank-a-cost":banks[0].cost,
  "bank-b-monthly":banks[1].monthly,"bank-b-interest":banks[1].interest,"bank-b-cost":banks[1].cost
 });
 try{
  const inputs={};document.querySelectorAll("#advanced-root input, #advanced-root select, #financing-panel input, #financing-panel select, #variable-panel input, #variable-panel select").forEach(e=>{if(e.id)inputs[e.id]=e.type==="checkbox"?e.checked:e.value});
  const events={early:Array.from(document.querySelectorAll('[data-kind="early"]')).map(r=>({year:r.querySelector('[data-key="year"]').value,amount:r.querySelector('[data-key="amount"]').value,mode:r.querySelector('[data-key="mode"]').value})),
   rates:Array.from(document.querySelectorAll('[data-kind="rate"]')).map(r=>({year:r.querySelector('[data-key="year"]').value,rate:r.querySelector('[data-key="rate"]').value}))};
  localStorage.setItem("loan-advanced-v2",JSON.stringify({inputs,events}));
 }catch(e){}
}
function init(){
 const required=["rate-mode","rate-change-controls","csv-monthly","advanced-root"];
 const missing=required.filter(id=>!$(id));
 if(missing.length){
  console.warn("[HomeLoan JP] Incomplete advanced controls (possible stale cached HTML):",missing.join(", "));
  return;
 }
 let restored=false;
 try{
  const saved=JSON.parse(localStorage.getItem("loan-advanced-v2")||"null");
  if(saved){
   for(const [id,value] of Object.entries(saved.inputs||{})){const e=$(id);if(e){if(e.type==="checkbox")e.checked=!!value;else e.value=value}}
   (saved.events?.early||[]).forEach(e=>newEvent("early",e));(saved.events?.rates||[]).forEach(e=>newEvent("rate",e));restored=true;
  }
 }catch(e){}
 if(!restored){}
 // v3 inputs are grouped by task: financing, prepayment and rate controls
 // are in the primary loan column; bank, fee and DTI controls remain below.
 const applies=e=>e.target.closest("#advanced-root,#financing-panel,#early-panel,#variable-panel");
 document.addEventListener("input",e=>{
  if(applies(e)&&e.target.matches("input,select")){syncPrepaymentCards();calculate();}
 });
 document.addEventListener("change",e=>{
  if(applies(e)&&e.target.matches("input,select")){syncPrepaymentCards();calculate();}
 });
 document.addEventListener("click",e=>{
  const button=e.target.closest("button");
  if(!button || !button.closest("#advanced-root,#financing-panel,#early-panel,#variable-panel"))return;
  if(button.classList.contains("remove-event")){button.closest(".event-row").remove();syncPrepaymentCards();calculate();return}
  if(button.id==="add-early"){newEvent("early");calculate()}
  if(button.id==="add-rate"){newEvent("rate");calculate()}
  if(button.dataset.ltv){
   const fraction=Number(button.dataset.ltv)/100,price=val("property-price");
   if(price>0){
    $("principal").value=Math.min(20000,Math.round(price*fraction*100)/100);
    $("down-payment").value=Math.round(price*(1-fraction)*100)/100;
    calculate();
   }
  }
  if(button.id==="property-sync"){
   const amount=val("property-price")-val("down-payment");
   if(amount>0&&amount<=20000){$("principal").value=amount;calculate()}
  }
 });
 const advancedCsv=$("csv-monthly");
 advancedCsv.addEventListener("click",()=>{
  const c=window.loanCurrentSimulation;if(!c){window.LoanValidation?.revealFirst();return;}
  const fx=window.HomeLoanFX?.csvRate();
  let header=ls("Thang,Nam,Lai suat (%),Goc dinh ky (JPY),Lai (JPY),Tra truoc (JPY),Tong thanh toan (JPY),Du no cuoi ky (JPY)","月,年,金利 (%),通常元金返済額 (JPY),利息 (JPY),繰上返済額 (JPY),総返済額 (JPY),期末残高 (JPY)","Month,Year,Interest rate (%),Regular principal (JPY),Interest (JPY),Early repayment (JPY),Total payment (JPY),Ending balance (JPY)");
  if(fx)header+=",Principal ("+fx.currency+", "+fx.rateDate+"),Interest ("+fx.currency+"),Early repayment ("+fx.currency+"),Total payment ("+fx.currency+"),Balance ("+fx.currency+")";
  const lines=[header,...c.rows.map(x=>{
   const nums=[x.month,x.year,x.rate,x.principal,x.interest,x.extra,x.paid,x.balance].map(v=>typeof v==="number"?Math.round(v*100)/100:v);
   if(fx)nums.push(...[x.principal,x.interest,x.extra,x.paid,x.balance].map(v=>Math.round(v*fx.rate*100)/100));
   return nums.join(",");
  })];
  const blob=new Blob(["\ufeff",lines.join("\r\n")],{type:"text/csv;charset=utf-8"});
  const u=URL.createObjectURL(blob),a=document.createElement("a");a.href=u;a.download="home-loan-lich-tra-no-thang.csv";a.click();setTimeout(()=>URL.revokeObjectURL(u),1000);
 });
 $("rate-mode").addEventListener("change",()=>{
  $("rate-change-controls").hidden=$("rate-mode").value!=="variable";
 });
 $("rate-change-controls").hidden=$("rate-mode").value!=="variable";
 // Mobile: collapse the detailed extra-payment form until the user needs it.
 // When a saved repayment schedule exists, leave it expanded for easy editing.
 const repay=$("early-panel");
 if(repay && window.matchMedia && window.matchMedia("(max-width: 640px)").matches &&
   !document.querySelector('[data-kind="early"]')){
  repay.open=false;
 }
}
window.LoanAdvanced={read,render,init};
init();
})();
