'use strict';
const fs=require('node:fs'),path=require('node:path');
const {fetchBank,SOURCES}=require('../lib/bank-source.js');
const root=path.resolve(__dirname,'..');
const file=n=>path.join(root,'data',n);
const read=(name,defaultValue)=>{try{return JSON.parse(fs.readFileSync(file(name),'utf8'))}catch(_){return defaultValue}};
const save=(name,value)=>fs.writeFileSync(file(name),JSON.stringify(value,null,2)+'\n');
function jst(){return new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Tokyo',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());}
function slotId(){return jst()+'@'+(process.env.RATE_SLOT||'initial');}
function changed(a,b){return !a||a.min!==b.min||a.max!==b.max||a.effectiveDate!==b.effectiveDate;}
async function syncRates({collect=fetchBank,now=new Date(),slot=slotId(),saveFiles=true}={}){
 const old=read('latest.json',{products:[],bankStatuses:{},checkedAt:null,lastSuccessAt:null});
 const history=read('history.json',{changes:[]});
 const logs=read('fetch-logs.json',{runs:[]});
 if(logs.runs.some(r=>r.slot===slot)){console.log('Already checked slot '+slot+' — no duplicate bank requests');return {skipped:true,slot};}
 const products=old.products.slice(),statuses={...old.bankStatuses},errors=[];
 let successes=0;
 for(const bank of ['smbc','suruga']){
  try{
   const incoming=await collect(bank);
   if(!Array.isArray(incoming)||incoming.length===0)throw Error('No verified products');
   const previous=products.filter(p=>p.bank===bank);
   if(previous.length){
    const lookup=new Map(previous.map(x=>[x.id,x]));
    if(incoming.some(p=>lookup.has(p.id)&&Math.max(Math.abs(p.min-lookup.get(p.id).min),Math.abs(p.max-lookup.get(p.id).max))>1.5))
      throw Error('Lãi suất chênh >1,5 điểm phần trăm; cần kiểm tra thủ công');
   }
   for(let i=products.length-1;i>=0;i--)if(products[i].bank===bank)products.splice(i,1);
   products.push(...incoming.map(p=>({...p,verifiedAt:now.toISOString()})));
   const lookup=new Map(previous.map(x=>[x.id,x]));
   for(const p of incoming)if(changed(lookup.get(p.id),p))history.changes.push({observedAt:now.toISOString(),bank,id:p.id,name:p.name,min:p.min,max:p.max,effectiveDate:p.effectiveDate,source:p.source});
   statuses[bank]={status:'ok',checkedAt:now.toISOString(),lastSuccessAt:now.toISOString(),source:SOURCES[bank],count:incoming.length};successes++;
  }catch(error){
   const message=String(error&&error.message||error).slice(0,240);
   errors.push({bank,message});
   statuses[bank]={...statuses[bank],status:'error',checkedAt:now.toISOString(),message,source:SOURCES[bank]};
  }
 }
 const result={schemaVersion:2,products:products.sort((a,b)=>a.bank.localeCompare(b.bank)||a.min-b.min),bankStatuses:statuses,checkedAt:now.toISOString(),lastSuccessAt:successes?now.toISOString():old.lastSuccessAt,errors,source:'GitHub Actions scheduled at 08:30/20:30 JST',disclaimer:'Lãi suất công bố, không phải lãi suất duyệt cá nhân.'};
 logs.runs.push({slot,checkedAt:now.toISOString(),status:errors.length?(successes?'partial':'failed'):'ok',bankResults:{smbc:statuses.smbc.status,suruga:statuses.suruga.status},errors});
 logs.runs=logs.runs.slice(-180);history.changes=history.changes.slice(-1000);history.updatedAt=now.toISOString();
 if(saveFiles){save('latest.json',result);save('history.json',history);save('fetch-logs.json',logs);}
 console.log(JSON.stringify({slot,checkedAt:result.checkedAt,successes,errors,productCount:products.length}));
 return {result,history,logs};
}
if(require.main===module)syncRates().catch(e=>{console.error(e);process.exitCode=1;});
module.exports={syncRates};
