(function(){
"use strict";
const C=window.LoanCore, $=id=>document.getElementById(id);
const money=n=>Number.isFinite(n)?Math.round(n).toLocaleString("vi-VN")+" ¥":"—";
const man=n=>Number.isFinite(n)?n.toLocaleString("vi-VN",{maximumFractionDigits:2})+" man":"—";
const pct=n=>Number.isFinite(n)?n.toLocaleString("vi-VN",{maximumFractionDigits:1})+"%":"—";
const val=(id,def=0)=>{const e=$(id);if(!e)return def;const n=Number(e.value);return e.value.trim()!==""&&Number.isFinite(n)?n:def};
const el=(tag,cls)=>{const e=document.createElement(tag);if(cls)e.className=cls;return e};
function newEvent(type,data={}){
 const node=el("div","event-row");node.dataset.kind=type;
 if(type==="early"){
  node.innerHTML='<label>Năm trả trước<input aria-label="Năm trả trước" type="number" data-key="year" min="1" max="50" step="1"></label><label>Số tiền (man)<input aria-label="Số tiền trả trước" type="number" data-key="amount" min="1" step="10" inputmode="decimal"></label><label>Phương thức<select aria-label="Kiểu trả trước" data-key="mode"><option value="reduce-term">Rút ngắn thời gian</option><option value="reduce-payment">Giảm tiền mỗi tháng</option></select></label><button type="button" class="remove-event" aria-label="Xóa lần trả trước">×</button>';
  node.querySelector('[data-key="year"]').value=data.year||5;
  node.querySelector('[data-key="amount"]').value=data.amount||500;
  node.querySelector('[data-key="mode"]').value=data.mode||"reduce-term";
 }else{
  node.innerHTML='<label>Bắt đầu từ năm<input aria-label="Lãi suất mới bắt đầu từ năm" type="number" data-key="year" min="2" max="50" step="1"></label><label>Lãi suất mới (%/năm)<input aria-label="Lãi suất mới mỗi năm" type="number" data-key="rate" min="0" max="100" step="0.01" inputmode="decimal"></label><button type="button" class="remove-event" aria-label="Xóa lần đổi lãi suất">×</button>';
  node.querySelector('[data-key="year"]').value=data.year||6;
  node.querySelector('[data-key="rate"]').value=data.rate??4.5;
 }
 $(type==="early"?"early-events":"rate-events").append(node);
}
function read(){
 const prepayments=Array.from(document.querySelectorAll('[data-kind="early"]')).map(r=>({
  month:Number(r.querySelector('[data-key="year"]').value)*12,
  amountMan:Number(r.querySelector('[data-key="amount"]').value),
  mode:r.querySelector('[data-key="mode"]').value
 }));
 const rateChanges=$("rate-mode").value==="variable"?Array.from(document.querySelectorAll('[data-kind="rate"]')).map(r=>({
  month:(Number(r.querySelector('[data-key="year"]').value)-1)*12+1,
  rate:Number(r.querySelector('[data-key="rate"]').value)
 })):[];
 return {prepayments,rateChanges};
}
function render(base,simulation){
 const standard=C.simulate({...base,prepayments:[]});
 const saved=standard.totalInterest-simulation.totalInterest;
 $("prepay-saved").textContent=money(saved);
 $("prepay-paid-off").textContent="Tháng "+simulation.paidOffMonth+" / "+simulation.months;
 $("prepay-extra").textContent=money(simulation.totalExtra);
 $("prepay-years").textContent=(simulation.paidOffMonth/12).toLocaleString("vi-VN",{maximumFractionDigits:1})+" năm";
 $("schedule-label").textContent=read().rateChanges.length?"Lãi suất thay đổi theo các mốc đã nhập": "Lãi suất giữ nguyên trong kỳ vay";
 const p=val("property-price",base.loanMan),deposit=val("down-payment"),ltv=p>0?base.loanMan/p*100:Infinity;
 $("ltv-result").textContent=pct(ltv);
 $("cash-down").textContent=money(C.yenFromMan(deposit));
 $("loan-gap").textContent=money(C.yenFromMan(p-deposit-base.loanMan));
 const feeOpts={loanMan:base.loanMan,closingPercent:val("closing-pct"),registrationMan:val("registration"),insuranceMan:val("insurance"),taxesMan:val("taxes"),otherMan:val("other"),includeBroker:$("include-broker").checked};
 const f=C.fees(feeOpts,p,val("bank-fee-pct"),val("bank-fee-man"));
 $("fee-total").textContent=money(f.total);
 $("cash-needed").textContent=money(C.yenFromMan(deposit)+f.total);
 $("total-housing").textContent=money(simulation.totalPaid+f.total);
 $("fee-breakdown").textContent="Phí ngân hàng "+money(f.bank)+" · Môi giới "+money(f.agency)+" · Phí khác "+money(f.total-f.bank-f.agency);
 const income=val("income"),other=val("other-debt"),upkeep=val("upkeep"),threshold=val("debt-threshold",30);
 const a=C.affordability(income,other,simulation.monthly,threshold,upkeep);
 const stress=C.maximumLoan(income,other,val("stress-rate"),base.years,threshold);
 $("debt-ratio").textContent=pct(a.ratio);
 $("monthly-budget").textContent=money(a.monthlyCapacity);
 $("housing-monthly").textContent=money(a.housingCashflow);
 $("max-estimated").textContent=man(stress);
 $("afford-status").textContent=!Number.isFinite(a.ratio)?"Hãy nhập thu nhập hợp lệ":a.underThreshold?"Trong ngưỡng mô phỏng ("+threshold+"%)":"Vượt ngưỡng mô phỏng ("+threshold+"%)";
 $("afford-status").className="state-label "+(a.underThreshold?"good":"warn");
 const banks=C.compareBanks({...base,prepayments:read().prepayments,rateChanges:[]},[
  {name:($("bank-a-name").value||"Ngân hàng A"),rate:val("bank-a-rate"),feePercent:val("bank-a-fee-pct"),feeMan:val("bank-a-fee")},
  {name:($("bank-b-name").value||"Ngân hàng B"),rate:val("bank-b-rate"),feePercent:val("bank-b-fee-pct"),feeMan:val("bank-b-fee")}
 ]);
 ["a","b"].forEach((s,i)=>{
  const b=banks[i];$("bank-"+s+"-monthly").textContent=money(b.monthly);
  $("bank-"+s+"-interest").textContent=money(b.interest);
  $("bank-"+s+"-cost").textContent=money(b.cost);
  $("bank-"+s+"-payoff").textContent=b.payoff+" tháng";
 });
 const delta=banks[0].cost-banks[1].cost;
 $("compare-difference").textContent=Math.abs(delta)<1?"Hai phương án có chi phí tương đương":(delta<0?banks[0].name:banks[1].name)+" thấp hơn "+money(Math.abs(delta))+" (gốc, lãi và phí ngân hàng).";
 // Show rate and payment events when the user is modeling them.
 $("payment-milestones").replaceChildren();
 const seen=new Set();
 simulation.recalculations.forEach(r=>{
  if(r.month===1||seen.has(r.month))return;
  seen.add(r.month);
  const item=el("span","milestone");
  item.textContent="Từ tháng "+r.month+": "+money(r.monthly)+"/tháng · "+r.rate+"%";
  $("payment-milestones").append(item);
 });
 if(!seen.size)$("payment-milestones").textContent="Không có kỳ điều chỉnh tiền trả.";
 try{
  const inputs={};document.querySelectorAll("#advanced-root input, #advanced-root select").forEach(e=>{if(e.id)inputs[e.id]=e.type==="checkbox"?e.checked:e.value});
  const events={early:Array.from(document.querySelectorAll('[data-kind="early"]')).map(r=>({year:r.querySelector('[data-key="year"]').value,amount:r.querySelector('[data-key="amount"]').value,mode:r.querySelector('[data-key="mode"]').value})),
   rates:Array.from(document.querySelectorAll('[data-kind="rate"]')).map(r=>({year:r.querySelector('[data-key="year"]').value,rate:r.querySelector('[data-key="rate"]').value}))};
  localStorage.setItem("loan-advanced-v2",JSON.stringify({inputs,events}));
 }catch(e){}
}
function init(){
 let restored=false;
 try{
  const saved=JSON.parse(localStorage.getItem("loan-advanced-v2")||"null");
  if(saved){
   for(const [id,value] of Object.entries(saved.inputs||{})){const e=$(id);if(e){if(e.type==="checkbox")e.checked=!!value;else e.value=value}}
   (saved.events?.early||[]).forEach(e=>newEvent("early",e));(saved.events?.rates||[]).forEach(e=>newEvent("rate",e));restored=true;
  }
 }catch(e){}
 if(!restored){}
 $("advanced-root").addEventListener("input",e=>{if(e.target.matches("input,select"))calculate()});
 $("advanced-root").addEventListener("change",e=>{
  if(e.target.matches("input,select"))calculate();
 });
 $("advanced-root").addEventListener("click",e=>{
  const button=e.target.closest("button");if(!button)return;
  if(button.classList.contains("remove-event")){button.closest(".event-row").remove();calculate();return}
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
  const c=window.loanCurrentSimulation;if(!c)return;
  const header="Thang,Nam,Lai suat (%),Goc dinh ky (JPY),Lai (JPY),Tra truoc (JPY),Tong thanh toan (JPY),Du no cuoi ky (JPY)";
  const lines=[header,...c.rows.map(x=>[x.month,x.year,x.rate,x.principal,x.interest,x.extra,x.paid,x.balance].map(v=>typeof v==="number"?Math.round(v*100)/100:v).join(","))];
  const blob=new Blob(["\ufeff",lines.join("\r\n")],{type:"text/csv;charset=utf-8"});
  const u=URL.createObjectURL(blob),a=document.createElement("a");a.href=u;a.download="home-loan-lich-tra-no-thang.csv";a.click();setTimeout(()=>URL.revokeObjectURL(u),1000);
 });
 $("rate-mode").addEventListener("change",()=>{
  $("rate-change-controls").hidden=$("rate-mode").value!=="variable";
 });
 $("rate-change-controls").hidden=$("rate-mode").value!=="variable";
}
window.LoanAdvanced={read,render,init};
init();
})();
