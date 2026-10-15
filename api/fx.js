'use strict';
/*
 * JPY-reference display FX rates. Frankfurter aggregates official/central-bank
 * quotes, updates daily. Vercel CDN caches the sanitized response for 12 hours.
 * Calculations always run in JPY; rates are never used for mortgage amortization.
 * Source: https://frankfurter.dev/ and https://api.frankfurter.dev/v2/rates
 */
const UPSTREAM='https://api.frankfurter.dev/v2/rates?base=JPY&quotes=VND,USD,EUR';
const ALLOWED=['VND','USD','EUR'];
module.exports=async function handler(req,res){
  res.setHeader('X-Content-Type-Options','nosniff');
  if(req.method!=='GET')return res.status(405).json({error:'Method not allowed'});
  try{
    const response=await fetch(UPSTREAM,{headers:{Accept:'application/json'},signal:AbortSignal.timeout(7500)});
    if(!response.ok)throw new Error('Upstream HTTP '+response.status);
    const rows=await response.json();
    if(!Array.isArray(rows))throw new Error('Unexpected upstream format');
    const converted={},dates={};
    for(const row of rows){
      const code=String(row?.quote||'').toUpperCase();
      const value=Number(row?.rate);
      if(row?.base!=='JPY'||!ALLOWED.includes(code)||!Number.isFinite(value)||value<=0||!/^\d{4}-\d\d-\d\d$/.test(row.date||''))continue;
      converted[code]=value;dates[code]=row.date;
    }
    if(ALLOWED.some(code=>!converted[code]))throw new Error('Missing verified currency');
    const snapshot={schemaVersion:1,base:'JPY',rates:{JPY:1,...converted},rateDates:dates,source:'Frankfurter',sourceUrl:'https://frankfurter.dev/',checkedAt:new Date().toISOString()};
    res.setHeader('Cache-Control','public, s-maxage=43200, stale-while-revalidate=3600');
    return res.status(200).json(snapshot);
  }catch(e){
    res.setHeader('Cache-Control','no-store');
    return res.status(503).json({schemaVersion:1,base:'JPY',rates:null,error:'Exchange-rate source unavailable'});
  }
};
