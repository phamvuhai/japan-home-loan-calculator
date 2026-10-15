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
 const LANG_LABELS={
  ja:{principal:"借入額",rate:"借入金利",years:"返済期間","property-price":"物件価格","down-payment":"頭金",income:"税込年収","other-debt":"その他の返済額","bank-a-rate":"プランAの金利","bank-b-rate":"プランBの金利","bank-a-name":"プランAの銀行名","bank-b-name":"プランBの銀行名"},
  en:{principal:"loan amount",rate:"annual interest rate",years:"loan term","property-price":"property price","down-payment":"down payment",income:"gross annual income","other-debt":"other monthly debt","bank-a-rate":"option A rate","bank-b-rate":"option B rate","bank-a-name":"option A bank","bank-b-name":"option B bank"}
 };
 const lang=()=>root.HomeLoanI18n?.language||"vi";
 const msg=(vi,ja,en)=>lang()==="ja"?ja:lang()==="en"?en:vi;
 let sequence=0;
 function labelOf(input){
  if(LABELS[input.id])return (LANG_LABELS[lang()]||{})[input.id]||LABELS[input.id];
  const key=input.dataset&&input.dataset.key;
  if(key==="year")return input.closest('[data-kind="early"]')?msg("năm trả nợ trước hạn","繰上返済の年","early repayment year"):msg("năm thay đổi lãi suất","金利変更の年","rate change year");
  if(key==="amount")return msg("số tiền trả nợ trước hạn","繰上返済額","early repayment amount");
  if(key==="rate")return msg("lãi suất thay đổi","変更後の金利","changed interest rate");
  const label=input.closest("label");
  return label ? label.textContent.trim().replace(/\s+/g," ").slice(0,80).toLowerCase() : msg("giá trị","値","value");
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
   return input.value.trim()?"":msg("Vui lòng nhập "+labelOf(input)+".",labelOf(input)+"を入力してください。","Please enter "+labelOf(input)+".");
  }
  if(input.type!=="number")return "";
  const label=labelOf(input),raw=input.value.trim();
  const needed=REQUIRED.has(input.id)||!!input.closest(".event-row");
  if(!raw)return needed?msg("Vui lòng nhập "+label+".",label+"を入力してください。","Please enter "+label+"."):"";
  const n=Number(raw);
  if(input.validity&&input.validity.badInput||!Number.isFinite(n))return msg(label+" phải là số hợp lệ.",label+"には有効な数値を入力してください。",label+" must be a valid number.");
  if((POSITIVE.has(input.id)||input.dataset&&input.dataset.key==="amount") && n<=0)return msg(label+" phải lớn hơn 0.",label+"は0より大きい値にしてください。",label+" must be greater than 0.");
  if((INTEGERS.has(input.id)||input.dataset&&input.dataset.key==="year")&&!Number.isInteger(n))return msg(label+" phải là số nguyên.",label+"には整数を入力してください。",label+" must be a whole number.");
  if(input.hasAttribute("min")&&n<Number(input.min))return msg(label+" phải từ "+input.min+" trở lên.",label+"は"+input.min+"以上にしてください。",label+" must be at least "+input.min+".");
  if(input.hasAttribute("max")&&n>Number(input.max))return msg(label+" không được vượt quá "+input.max+".",label+"は"+input.max+"以下にしてください。",label+" must not exceed "+input.max+".");
  const price=typeof document==="undefined"?null:document.getElementById("property-price");
  if(input.id==="down-payment"&&price&&price.value.trim()&&Number.isFinite(Number(price.value))&&n>Number(price.value))return msg("Tiền trả trước không thể lớn hơn giá nhà.","頭金は物件価格を超えることはできません。","The down payment cannot exceed the property price.");
  if(input.dataset&&input.dataset.key==="year"&&Number.isFinite(n)){
   const years=document.getElementById("years");
   const term=years?Number(years.value):NaN;
   if(Number.isFinite(term)&&n>term)return msg(label+" không được vượt thời hạn vay ("+term+" năm).",label+"は借入期間（"+term+"年）を超えることはできません。",label+" cannot exceed the loan term ("+term+" years).");
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
