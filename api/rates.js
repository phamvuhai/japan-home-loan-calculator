'use strict';
/* Reads committed official-rate snapshots only. Never requests bank sites per visitor. */
const SNAPSHOT='https://raw.githubusercontent.com/phamvuhai/japan-home-loan-calculator/main/data/latest.json';
module.exports=async function handler(req,res){
 if(req.method!=='GET')return res.status(405).json({error:'Method not allowed'});
 try{
  const response=await fetch(SNAPSHOT,{headers:{Accept:'application/json'},signal:AbortSignal.timeout(6500)});
  if(!response.ok)throw Error('Snapshot HTTP '+response.status);
  const data=await response.json();
  if(data.schemaVersion!==2||!Array.isArray(data.products))throw Error('Snapshot không hợp lệ');
  res.setHeader('Cache-Control','public, s-maxage=900, stale-while-revalidate=1800');
  res.setHeader('X-Content-Type-Options','nosniff');
  return res.status(200).json(data);
 }catch(e){res.setHeader('Cache-Control','no-store');return res.status(503).json({schemaVersion:2,products:[],errors:[{bank:'system',message:'Không đọc được dữ liệu đã lưu: '+e.message}],checkedAt:null});}
};
