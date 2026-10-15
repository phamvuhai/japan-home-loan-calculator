'use strict';
/* Daily reference history is requested from Frankfurter on demand (2-month backfill).
   Actual 11:00/19:00 JST observations are read from a dedicated GitHub data branch.
   Historical daily rates are NEVER represented as past 11:00/19:00 observations. */
const SOURCE='https://api.frankfurter.dev/v2/rates';
const OBS='https://raw.githubusercontent.com/phamvuhai/japan-home-loan-calculator/fx-history-data/data/fx-history.json';
const CODES=['VND','USD','EUR'];
const initial='2026-08-16';
function jstDate(){return new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Tokyo',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());}
function checkRate(r){return r&&r.base==='JPY'&&CODES.includes(r.quote)&&/^\d{4}-\d{2}-\d{2}$/.test(r.date||'')&&Number.isFinite(Number(r.rate))&&Number(r.rate)>0}
function historicalRows(list,start,end){
 const grouped=new Map();
 for(const r of list){
  if(!checkRate(r)||r.date<start||r.date>end)continue;
  if(!grouped.has(r.date))grouped.set(r.date,{date:r.date,kind:'daily-reference',rates:{},sourceDate:r.date});
  grouped.get(r.date).rates[r.quote]=Number(r.rate);
 }
 return [...grouped.values()].filter(r=>CODES.every(code=>r.rates[code]>0)).sort((a,b)=>a.date.localeCompare(b.date));
}
module.exports=async function handler(req,res){
 res.setHeader('X-Content-Type-Options','nosniff');
 if(req.method!=='GET')return res.status(405).json({error:'Method not allowed'});
 const today=jstDate();
 const start=/^\d{4}-\d{2}-\d{2}$/.test(String(req.query?.from||''))?req.query.from:initial;
 const end=/^\d{4}-\d{2}-\d{2}$/.test(String(req.query?.to||''))?req.query.to:today;
 if(start>end||end>today||start<'2020-01-01'||(Date.parse(end)-Date.parse(start))>366*6*86400000)return res.status(400).json({error:'Invalid date range'});
 let daily=[],observations=[],historyError=null,observationError=null;
 try{
  const url=SOURCE+'?'+new URLSearchParams({from:start,to:end,base:'JPY',quotes:CODES.join(',')});
  const response=await fetch(url,{headers:{Accept:'application/json'},signal:AbortSignal.timeout(10000)});
  if(!response.ok)throw Error('Frankfurter HTTP '+response.status);
  const raw=await response.json();if(!Array.isArray(raw))throw Error('Unexpected history format');
  daily=historicalRows(raw,start,end);
  if(!daily.length)throw Error('No verified daily observations');
 }catch(e){historyError='Historical source temporarily unavailable'}
 try{
  const response=await fetch(OBS,{headers:{Accept:'application/json'},signal:AbortSignal.timeout(6000)});
  if(response.ok){
   const raw=await response.json();
   if(raw?.schemaVersion===1&&Array.isArray(raw.daily)&&!daily.length){
    const backup=raw.daily.filter(row=>row?.date>=start&&row?.date<=end&&CODES.every(c=>Number(row.rates?.[c])>0));
    daily=backup.map(row=>({date:row.date,kind:'daily-reference',rates:Object.fromEntries(CODES.map(c=>[c,Number(row.rates[c])])),sourceDate:row.date})).sort((a,b)=>a.date.localeCompare(b.date));
    if(daily.length)historyError='Using last verified stored daily history';
   }
   if(raw?.schemaVersion===1&&Array.isArray(raw.observations)){
    observations=raw.observations.filter(o=>o&&typeof o.observedAt==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(o.date||'')&&o.date>=start&&o.date<=end&&['11:00','19:00'].includes(o.slot)&&['ok','error'].includes(o.status)).map(o=>({
      date:o.date,slot:o.slot,kind:'scheduled-observation',status:o.status,
      observedAt:o.observedAt,sourceDates:o.sourceDates||{},
      rates:o.status==='ok'?Object.fromEntries(CODES.filter(c=>Number.isFinite(Number(o.rates?.[c]))&&Number(o.rates[c])>0).map(c=>[c,Number(o.rates[c])])):{},
      source:'Frankfurter'
    })).sort((a,b)=>a.observedAt.localeCompare(b.observedAt));
   }
  }else observationError='Scheduled observations not initialized';
 }catch(_){observationError='Scheduled observation store unavailable'}
 res.setHeader('Cache-Control','public, s-maxage=300, stale-while-revalidate=900');
 return res.status(daily.length||observations.length?200:503).json({
  schemaVersion:1,base:'JPY',from:start,to:end,checkedAt:new Date().toISOString(),
  currencies:CODES,source:'Frankfurter',sourceUrl:'https://frankfurter.dev/',
  daily,observations,historyError,observationError
 });
};
