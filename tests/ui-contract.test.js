"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const root=path.resolve(__dirname,"..");
const html=fs.readFileSync(path.join(root,"index.html"),"utf8");
const advanced=fs.readFileSync(path.join(root,"advanced.js"),"utf8");
const validation=fs.readFileSync(path.join(root,"validation.js"),"utf8");
const scripts=html.match(/<script>([\s\S]*?)<\/script>/)?.[1]||"";
const ids=new Set([...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]));
const basic=["monthly","quick-monthly","mobile-monthly","total-interest","total-paid","principal-result","interest-share","payments","first-interest","loan-in-yen","schedule-body","amortization-chart","chart-year-label","chart-year-principal","chart-year-interest","error"];
const advancedOutputs=["prepay-saved","prepay-paid-off","prepay-extra","prepay-years","schedule-label","ltv-result","cash-down","loan-gap","fee-total","cash-needed","total-housing","purchase-warning","fee-breakdown","debt-ratio","monthly-budget","housing-monthly","max-estimated","afford-status","compare-difference","payment-milestones",...["a","b"].flatMap(x=>["monthly","interest","cost","payoff"].map(y=>"bank-"+x+"-"+y))];
test("Every calculator result referenced at startup exists in the page",()=>{
 for(const id of basic.concat(advancedOutputs))assert.ok(ids.has(id),"Missing HTML #"+id);
});
test("Advanced module keeps a declared render DOM contract",()=>{
 for(const id of advancedOutputs)assert.ok(advanced.includes('"'+id+'"'),"Advanced DOM ID missing from source: "+id);
 assert.match(advanced,/function availableResults\(/);
 assert.match(advanced,/if\(!availableResults\(\)\)return/);
});
test("All main script dependencies carry the same version",()=>{
 const loaded=[...html.matchAll(/<script src="([^"]+\.js\?v=[^"]+)"\s*><\/script>/g)].map(m=>m[1]);
 assert.equal(loaded.length,3);
 const versions=loaded.map(x=>x.split("?v=")[1]);
 assert.equal(new Set(versions).size,1);
 assert.deepEqual(loaded.map(x=>x.split("?")[0]),["calculator-core.js","advanced.js","validation.js"]);
});
test("The page reports a failed script load without leaking raw JS error",()=>{
 assert.match(scripts,/Required scripts are unavailable/);
 assert.match(scripts,/Không thể cập nhật một số kết quả/);
});
test("UI field validator remains available for numeric and required checks",()=>{
 assert.match(validation,/function validate\(/);
 assert.match(validation,/function validateValue\(/);
 assert.match(validation,/is-invalid/);
});

test("A missing advanced result never crashes initial loan calculation",()=>{
 const vm=require("node:vm");
 const notices=[];
 const controls=new Map([
  ["rate-mode",{value:"fixed",addEventListener(){}}],
  ["rate-change-controls",{hidden:false}],
  ["csv-monthly",{addEventListener(){}}],
  ["advanced-root",{addEventListener(){}}]
 ]);
 const sandbox={
  window:{LoanCore:{}},
  document:{
   getElementById(id){return controls.get(id)||null},
   addEventListener(){},querySelectorAll(){return []}
  },
  localStorage:{getItem(){return null}},
  console:{warn(...args){notices.push(args.join(" "))}}
 };
 vm.runInNewContext(advanced,sandbox,{filename:"advanced.js"});
 assert.doesNotThrow(()=>sandbox.window.LoanAdvanced.render({},{}));
 assert.ok(notices.some(message=>message.includes("Missing advanced UI elements")));
});


test("Responsive workflow: upfront cash, loan, prepayment and variable rate stay in task order",()=>{
 const nodes=["financing-panel","principal","early-panel","variable-panel","result-title","purchase-panel","income-panel","bank-panel"];
 let prev=-1;
 for(const id of nodes){
  const current=html.indexOf('id="'+id+'"');
  assert.ok(current>prev,"Incorrect position of #"+id);
  prev=current;
 }
 assert.match(html,/id="prepay-quick-summary"/);
 assert.match(html,/class="input-preview"[\s\S]*id="quick-monthly"/);
 assert.ok(html.indexOf('id="quick-monthly"')<html.indexOf('id="financing-panel"'),"Tablet/mobile payment preview should appear before form fields");
});
test("Mobile, tablet and desktop have distinct responsive rules and accessible tap targets",()=>{
 assert.match(html,/HomeLoan JP v4/);
 assert.match(html,/@media\(min-width:1101px\)/);
 assert.match(html,/@media\(min-width:641px\) and \(max-width:1100px\)/);
 assert.match(html,/@media\(max-width:640px\)/);
 assert.match(html,/body:has\(input:focus\) \.mobile-pay/);
 assert.match(html,/#advanced-root \.advanced-grid\{grid-template-columns:1fr/);
 assert.match(html,/#advanced-root #bank-panel\{grid-column:1\/-1\}/);
});
test("Additional-cost and bank sections initially collapse for shorter mobile scrolling",()=>{
 for(const id of ["purchase-panel","income-panel","bank-panel"]){
  assert.ok(html.includes('id="'+id+'">'),"Summary not collapsed: "+id);
 }
 assert.ok(html.includes('id="early-panel" open'),"prepayment should be open by default for desktop");
});
