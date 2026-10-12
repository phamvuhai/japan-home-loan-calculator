/* HomeLoan JP — field validation shared by the calculator workflow. */
(function(root){
 "use strict";
 const REQUIRED=new Set(["principal","rate","years","property-price","down-payment","income","other-debt","bank-a-rate","bank-b-rate"]);
 const POSITIVE=new Set(["principal","property-price","income"]);
 const INTEGERS=new Set(["years"]);
 const LABELS={
  principal:"số tiền vay",rate:"lãi suất hằng năm",years:"thời hạn vay",
  "property-price":"giá nhà","down-payment":"tiền trả trước",
  income:"thu nhập năm", "other-debt":"khoản nợ khác mỗi tháng",
  "bank-a-rate":"lãi suất phương án A","bank-b-rate":"lãi suất phương án B",
  "bank-a-name":"tên ngân hàng A","bank-b-name":"tên ngân hàng B"
 };
 let sequence=0;
 function labelOf(input){
  if(LABELS[input.id])return LABELS[input.id];
  const key=input.dataset&&input.dataset.key;
  if(key==="year")return input.closest('[data-kind="early"]')?"năm trả nợ trước hạn":"năm thay đổi lãi suất";
  if(key==="amount")return "số tiền trả nợ trước hạn";
  if(key==="rate")return "lãi suất thay đổi";
  const label=input.closest("label");
  return label ? label.textContent.trim().replace(/\s+/g," ").slice(0,80).toLowerCase() : "giá trị";
 }
 function activeField(input){
  if(input.disabled)return false;
  if(input.closest('[data-kind="rate"]')){
   const mode=document.getElementById("rate-mode");
   if(!mode || mode.value!=="variable")return false;
  }
  return true;
 }
 function validateValue(input){
  if(!activeField(input))return "";
  if(input.type==="text" && input.closest(".bank-column")){
   return input.value.trim()?"":"Vui lòng nhập "+labelOf(input)+".";
  }
  if(input.type!=="number")return "";
  const label=labelOf(input),raw=input.value.trim();
  const needed=REQUIRED.has(input.id)||!!input.closest(".event-row");
  if(!raw)return needed?"Vui lòng nhập "+label+".":"";
  const n=Number(raw);
  if(input.validity&&input.validity.badInput||!Number.isFinite(n))return label+" phải là số hợp lệ.";
  if((POSITIVE.has(input.id)||input.dataset&&input.dataset.key==="amount") && n<=0)return label+" phải lớn hơn 0.";
  if((INTEGERS.has(input.id)||input.dataset&&input.dataset.key==="year")&&!Number.isInteger(n))return label+" phải là số nguyên.";
  if(input.hasAttribute("min")&&n<Number(input.min))return label+" phải từ "+input.min+" trở lên.";
  if(input.hasAttribute("max")&&n>Number(input.max))return label+" không được vượt quá "+input.max+".";
  const price=typeof document==="undefined"?null:document.getElementById("property-price");
  if(input.id==="down-payment"&&price&&price.value.trim()&&Number.isFinite(Number(price.value))&&n>Number(price.value))return "Tiền trả trước không thể lớn hơn giá nhà.";
  if(input.dataset&&input.dataset.key==="year"&&Number.isFinite(n)){
   const years=document.getElementById("years");
   const term=years?Number(years.value):NaN;
   if(Number.isFinite(term)&&n>term)return label+" không được vượt thời hạn vay ("+term+" năm).";
  }
  return "";
 }
 function ensureError(input){
  if(!input.id)input.id="loan-field-"+(++sequence);
  const errorId=input.id+"-error";
  let message=document.getElementById(errorId);
  if(!message){
   message=document.createElement("p");
   message.id=errorId;
   message.className="field-error";
   message.setAttribute("role","alert");
   const anchor=input.closest(".input-group")||input.closest("label")||input;
   anchor.insertAdjacentElement("afterend",message);
  }
  const links=(input.getAttribute("aria-describedby")||"").split(/\s+/).filter(Boolean);
  if(!links.includes(errorId))input.setAttribute("aria-describedby",links.concat(errorId).join(" "));
  return message;
 }
 function mark(input,message){
  const host=input.closest(".field")||input.closest("label")||input.closest(".event-row");
  const text=ensureError(input);
  text.textContent=message;
  text.hidden=!message;
  input.classList.toggle("is-invalid",!!message);
  input.setAttribute("aria-invalid",message?"true":"false");
  if(host)host.classList.toggle("has-error",!!message);
 }
 function fields(){
  return Array.from(document.querySelectorAll('main input[type="number"], main .bank-column input[type="text"]'))
   .filter(el=>el.id||el.closest(".event-row"));
 }
 function validate(){
  const errors=[];
  fields().forEach(input=>{
   const message=validateValue(input);
   mark(input,message);
   if(message)errors.push({input,message});
  });
  return {valid:errors.length===0,errors};
 }
 function revealFirst(){
  const result=validate();
  if(!result.valid){
   const first=result.errors[0].input;
   let ancestor=first.closest("details");
   while(ancestor){ancestor.open=true;ancestor=ancestor.parentElement&&ancestor.parentElement.closest("details");}
   first.scrollIntoView({behavior:"smooth",block:"center"});
   try{first.focus({preventScroll:true});}catch(_){first.focus();}
  }
  return result.valid;
 }
 root.LoanValidation={validate,validateValue,revealFirst};
 if(typeof module!=="undefined"&&module.exports)module.exports={validateValue};
})(typeof window!=="undefined"?window:globalThis);
