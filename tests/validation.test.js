'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {validateValue}=require('../validation.js');
function field(id,value,opts={}){
 const a={
  id,type:opts.type||'number',value:String(value),disabled:false,
  min:opts.min??'',max:opts.max??'',validity:{badInput:false},
  dataset:opts.key?{key:opts.key}:{},
  hasAttribute(name){return name==='min'?a.min!=='':name==='max'?a.max!=='':false;},
  closest(selector){
   if(selector==='.event-row')return opts.event?{}:null;
   if(selector==='.bank-column')return opts.bank?{}:null;
   if(selector==='[data-kind="rate"]')return opts.rateEvent?{}:null;
   if(selector==='[data-kind="early"]')return opts.earlyEvent?{}:null;
   return null;
  }
 };
 return a;
}
test('Required inputs are not silently converted to zero',()=>{
 assert.match(validateValue(field('principal','',{min:'1',max:'20000'})),/Vui lòng nhập/);
 assert.match(validateValue(field('income','0',{min:'0'})),/lớn hơn 0/);
 assert.match(validateValue(field('rate','-1',{min:'0',max:'100'})),/từ 0/);
 assert.match(validateValue(field('principal','20001',{max:'20000'})),/20000/);
 assert.equal(validateValue(field('rate','0',{min:'0',max:'100'})),'');
});
test('Term is an integer in 1–50 years',()=>{
 assert.match(validateValue(field('years','7.3',{min:'1',max:'50'})),/số nguyên/);
 assert.match(validateValue(field('years','51',{min:'1',max:'50'})),/50/);
 assert.equal(validateValue(field('years','35',{min:'1',max:'50'})),'');
});
test('Up-front payment may be 0 but never larger than house price',()=>{
 const previous=global.document;const house=field('property-price','3200',{min:'1'});
 global.document={getElementById:id=>id==='property-price'?house:null};
 try{
  assert.equal(validateValue(field('down-payment','0',{min:'0'})),'');
  assert.match(validateValue(field('down-payment','3300',{min:'0'})),/lớn hơn giá nhà/);
  assert.match(validateValue(field('down-payment','',{min:'0'})),/Vui lòng nhập/);
 }finally{global.document=previous;}
});
test('Dynamic payment events require valid years within loan term',()=>{
 const previous=global.document;global.document={getElementById:id=>id==='years'?field('years','30'):null};
 try{
  assert.match(validateValue(field('', '31',{key:'year',event:true,earlyEvent:true,min:'1',max:'50'})),/30 năm/);
  assert.match(validateValue(field('', '-1',{key:'amount',event:true,min:'0'})),/lớn hơn 0/);
  assert.equal(validateValue(field('', '20',{key:'year',event:true,min:'1',max:'50'})),'');
 }finally{global.document=previous;}
});
test('Required bank comparison rate and names are validated',()=>{
 assert.match(validateValue(field('bank-a-rate','')),/Vui lòng nhập/);
 assert.match(validateValue(field('bank-b-name','',{type:'text',bank:true})),/Vui lòng nhập/);
 assert.equal(validateValue(field('bank-b-name','Suruga Bank',{type:'text',bank:true})),'');
});
test('Optional cost fields allow blank/zero but reject negative values',()=>{
 assert.equal(validateValue(field('insurance','',{min:'0'})),'');
 assert.equal(validateValue(field('insurance','0',{min:'0'})),'');
 assert.match(validateValue(field('insurance','-3',{min:'0'})),/từ 0/);
});
test('Main calculator has repaired HTML and loads validation module',()=>{
 const html=fs.readFileSync(require('node:path').resolve(__dirname,'../index.html'),'utf8');
 assert.match(html,/class="input-preview" aria-live="polite"/);
 assert.doesNotMatch(html,/aria-live="polite'/);
 assert.match(html,/src="validation\.js"/);
 assert.match(html,/window\.LoanValidation\.validate\(\)/);
 assert.match(html,/window\.LoanValidation\.revealFirst\(\)/);
 assert.match(html,/id="quick-monthly"/);
});
