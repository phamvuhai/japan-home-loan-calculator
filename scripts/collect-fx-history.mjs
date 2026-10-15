#!/usr/bin/env node
/* Run at 11:00 and 19:00 Japan time via GitHub Actions.
   Backfill real DAILY historical rates from 2026-08-16, with no invented intraday points.
   Observation records capture actual execution time and the underlying rate date. */
import fs from 'node:fs';
import path from 'node:path';
const DEST=process.argv[2]||'data/fx-history.json';
const base='https://api.frankfurter.dev/v2/rates';
const currencies=['VND','USD','EUR'];
const observedAt=new Date().toISOString();
const parts=new Intl.DateTimeFormat('en-US',{timeZone:'Asia/Tokyo',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date());
const part=k=>parts.find(p=>p.type===k)?.value||'';
const date=part('year')+'-'+part('month')+'-'+part('day');
const hour=Number(new Intl.DateTimeFormat('en-US',{timeZone:'Asia/Tokyo',hour:'2-digit',hourCycle:'h23'}).format(new Date()));
// For schedule delays, preserve which slot was scheduled using workflow env, not run time.
const slot=process.env.FX_SLOT==='11:00'||process.env.FX_SLOT==='19:00'?process.env.FX_SLOT:hour<15?'11:00':'19:00';
const read=()=>{try{return JSON.parse(fs.readFileSync(DEST,'utf8'))}catch{return {}}};
const data=read();
data.schemaVersion=1;data.base='JPY';data.historicalStart='2026-08-16';data.source='Frankfurter';
if(!Array.isArray(data.observations))data.observations=[];
if(!Array.isArray(data.daily))data.daily=[];
const request=async params=>{
 const url=base+'?'+new URLSearchParams(params);
 const r=await fetch(url,{headers:{Accept:'application/json'},signal:AbortSignal.timeout(16000)});
 if(!r.ok)throw new Error('HTTP '+r.status);
 const d=await r.json();if(!Array.isArray(d))throw new Error('Unexpected API response');
 return d;
};
const valid=x=>x&&x.base==='JPY'&&currencies.includes(x.quote)&&/^\d{4}-\d{2}-\d{2}$/.test(x.date||'')&&Number.isFinite(Number(x.rate))&&Number(x.rate)>0;
let historyOk=false;
try{
 const rows=await request({from:'2026-08-16',to:date,base:'JPY',quotes:currencies.join(',')});
 const grouped=new Map(data.daily.map(r=>[r.date,r]));
 for(const r of rows)if(valid(r)&&r.date>='2026-08-16'&&r.date<=date){
  if(!grouped.has(r.date))grouped.set(r.date,{date:r.date,rates:{},kind:'daily-reference'});
  grouped.get(r.date).rates[r.quote]=Number(r.rate);
 }
 data.daily=[...grouped.values()].filter(x=>/^\d{4}-\d{2}-\d{2}$/.test(x.date)&&currencies.every(c=>Number(x.rates?.[c])>0)).sort((a,b)=>a.date.localeCompare(b.date));
 historyOk=data.daily.length>0;
 console.log('Daily reference dates:',data.daily.length);
}catch(e){console.error('Daily history fetch failed:',e.message);}
if(process.env.FX_BACKFILL_ONLY==='1'){
 if(!historyOk)throw new Error('Historical backfill failed; no verified rates were collected.');
 data.updatedAt=observedAt;
 fs.mkdirSync(path.dirname(DEST),{recursive:true});
 fs.writeFileSync(DEST,JSON.stringify(data,null,2)+'\\n');
 console.log('Backfill completed without claiming any 11:00/19:00 observation:',data.daily.length,'days');
 process.exit(0);
}
const entry={date,slot,observedAt,source:'Frankfurter',status:'error',rates:{},sourceDates:{}};
try{
 const latest=await request({base:'JPY',quotes:currencies.join(',')});
 for(const r of latest)if(valid(r)){entry.rates[r.quote]=Number(r.rate);entry.sourceDates[r.quote]=r.date;}
 if(currencies.some(c=>!(entry.rates[c]>0)))throw new Error('Not all quote currencies verified');
 entry.status='ok';
}catch(e){entry.error='Rate source unavailable';console.error('Observation fetch failed:',e.message);}
const existing=data.observations.findIndex(x=>x.date===entry.date&&x.slot===entry.slot);
if(existing<0)data.observations.push(entry);
else if(data.observations[existing].status!=='ok'||entry.status==='ok')data.observations[existing]=entry;
data.observations.sort((a,b)=>String(a.date+' '+a.slot).localeCompare(String(b.date+' '+b.slot)));
data.updatedAt=observedAt;
fs.mkdirSync(path.dirname(DEST),{recursive:true});
fs.writeFileSync(DEST,JSON.stringify(data,null,2)+'\n');
console.log('Slot',date,slot,'status',entry.status,'historical backfilled',historyOk);
