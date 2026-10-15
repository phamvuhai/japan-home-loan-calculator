/* HomeLoan JP — historical FX dashboard. Historic points are daily reference rates,
 * not fabricated 11:00/19:00 JST intraday observations. */
(function(){
'use strict';
const $=id=>document.getElementById(id), initDate='2026-08-16';
const currencies=['VND','USD','EUR'];
const dict={
 vi:{
  calculator:'← Máy tính vay',bankRates:'Lãi suất ngân hàng',title:'Lịch sử tỷ giá JPY',
  intro:'Dữ liệu lịch sử theo ngày từ 16/08/2026; ghi nhận thực tế lúc 11:00 và 19:00 JST từ khi hệ thống thu thập. Bấm vào điểm trên biểu đồ để xem tỷ giá tại thời điểm đó.',
  indication:'Tỷ giá tham khảo',filters:'Bộ lọc lịch sử',pair:'Loại tiền',period:'Xem theo',year:'Năm',month:'Tháng',day:'Ngày',
  selectedPeriod:'Thời gian đã chọn',jumpHint:'Chạm vào điểm hoặc chọn hàng trong bảng để xem chi tiết. Chọn tháng hoặc ngày để đi sâu hơn.',
  scheduleTitle:'Lịch thu thập',morning:'Lần 1 – Buổi trưa',evening:'Lần 2 – Buổi tối',
  scheduleNote:'Hai lần kiểm tra có thể cho cùng một tỷ giá tham khảo vì nguồn được cập nhật theo ngày.',
  overview:'Tổng hợp biến động',loading:'Đang tải dữ liệu thực tế…',first:'Đầu kỳ',last:'Cuối kỳ',low:'Thấp nhất',high:'Cao nhất',
  point:'Điểm tỷ giá',up:'Tăng',down:'Giảm',chartHint:'Click, chạm hoặc dùng Tab + Enter vào điểm để xem tỷ giá chi tiết. Trên điện thoại có thể vuốt biểu đồ ngang.',
  selectedDetail:'Chi tiết điểm đã chọn',date:'Ngày / giờ',value:'Tỷ giá 1 JPY',change:'Thay đổi so với trước',
  rateDate:'Ngày hiệu lực nguồn',source:'Nguồn',detailTable:'Bảng chi tiết tỷ giá',
  tableHint:'Chọn một hàng để đánh dấu điểm tương ứng trên biểu đồ.',time:'Thời điểm',kind:'Loại dữ liệu',
  disclaimer:'Tỷ giá dùng để tham khảo, không phải giá mua/bán tại ngân hàng. Dữ liệu 2 tháng quá khứ là tham chiếu theo ngày, không có giờ 11:00/19:00. Các mốc giờ chỉ áp dụng với các lần quan sát thực tế sau khi hệ thống thu thập. Dữ liệu thị trường có thể được công bố trễ vào cuối tuần/ngày lễ.',
  dayReference:'Dữ liệu tham chiếu theo ngày',observed:'Quan sát thực tế',monthAvg:'Trung bình tháng',bad:'Lần lấy dữ liệu lỗi',
  noData:'Không có dữ liệu xác minh trong thời gian này.',live:'Đã tải dữ liệu từ nguồn',cached:'Đang sử dụng dữ liệu đã lưu',error:'Không tải được dữ liệu lịch sử',
  noteDaily:'Giá trị do nguồn công bố cho ngày này, không phải giá riêng lúc 11:00 hoặc 19:00.',
  noteObserved:'Giờ hiển thị là thời điểm hệ thống thực sự kiểm tra. Ngày hiệu lực của nguồn có thể khác.',
  noteAverage:'Giá trị trung bình của các ngày có dữ liệu trong tháng, không phải tỷ giá tại một thời điểm cụ thể.',
  noteNone:'Chọn một điểm trên biểu đồ hoặc bảng để xem chi tiết.',count:'điểm',viewMonth:'Xem chi tiết tháng',viewDay:'Xem chi tiết ngày',
  average:'TB tháng',sourceMissing:'Nguồn chưa có dữ liệu mới trong ngày',dataLoaded:'Dữ liệu tham chiếu thực',sourceError:'Nguồn dữ liệu đang lỗi',
  previous:'Thời gian trước',next:'Thời gian sau'
 },
 ja:{
  calculator:'← 返済シミュレーター',bankRates:'銀行金利',title:'円の為替レート履歴',
  intro:'2026年8月16日以降の日次参考レートを表示します。11:00・19:00（日本時間）の観測は収集開始後の実際の記録のみです。グラフの点を選ぶと詳細を確認できます。',
  indication:'参考為替レート',filters:'履歴フィルター',pair:'通貨ペア',period:'表示単位',year:'年',month:'月',day:'日',
  selectedPeriod:'表示期間',jumpHint:'グラフの点または表の行を選択して詳細を表示します。月・日単位に切り替えると詳細を確認できます。',
  scheduleTitle:'自動観測の予定',morning:'1回目 – 午前',evening:'2回目 – 夕方',
  scheduleNote:'参照元は日次更新のため、11:00と19:00で同じレートになることがあります。',
  overview:'為替変動の概要',loading:'実データを読み込み中…',first:'期首',last:'期末',low:'最安値',high:'最高値',
  point:'為替レートの点',up:'上昇',down:'下落',chartHint:'グラフの点をクリック・タップ、またはTabとEnterで選択できます。スマートフォンでは横にスクロールできます。',
  selectedDetail:'選択したポイントの詳細',date:'日付・時刻',value:'1円のレート',change:'前回比',
  rateDate:'参照元の適用日',source:'データ提供元',detailTable:'為替レート一覧',
  tableHint:'行を選択するとグラフの対応する点が強調表示されます。',time:'日時',kind:'データ種別',
  disclaimer:'参考レートは銀行の両替・送金レートではありません。過去2か月分は日次データであり、過去の11:00・19:00時点の価格ではありません。時間帯別の点は収集開始後の実際の観測記録に限ります。休日などは更新が遅れる場合があります。',
  dayReference:'日次参考レート',observed:'実際の観測記録',monthAvg:'月間平均',bad:'データ取得エラー',
  noData:'この期間の確認済みデータがありません。',live:'データ取得済み',cached:'保存済みデータを表示中',error:'履歴を取得できません',
  noteDaily:'この日の公表参考レートです。11:00または19:00の実勢価格ではありません。',
  noteObserved:'表示時間は実際の確認日時です。参照元のレート適用日は異なる場合があります。',
  noteAverage:'データが存在する日の日次参考レート平均です。特定時点の価格ではありません。',
  noteNone:'グラフまたは表からポイントを選択してください。',count:'ポイント',viewMonth:'この月を表示',viewDay:'この日を表示',
  average:'月平均',sourceMissing:'当日の新しい公表値がありません',dataLoaded:'確認済み参考データ',sourceError:'データ提供元エラー',
  previous:'前の期間',next:'次の期間'
 },
 en:{
  calculator:'← Loan calculator',bankRates:'Bank rates',title:'JPY exchange-rate history',
  intro:'Daily reference rates from August 16, 2026. Actual 11:00 and 19:00 JST observations appear only after collection starts. Click a chart point to inspect its rate and source date.',
  indication:'Indicative FX rates',filters:'History filters',pair:'Currency pair',period:'View by',year:'Year',month:'Month',day:'Day',
  selectedPeriod:'Selected period',jumpHint:'Tap a point or table row to see its details. Switch to month or day for a closer look.',
  scheduleTitle:'Collection schedule',morning:'Run 1 – Morning',evening:'Run 2 – Evening',
  scheduleNote:'Both daily checks can return the same reference rate because the provider publishes daily.',
  overview:'Exchange-rate trends',loading:'Loading verified rates…',first:'Period start',last:'Period end',low:'Lowest',high:'Highest',
  point:'Rate point',up:'Up',down:'Down',chartHint:'Click, tap or use Tab + Enter on a chart point to view its details. Swipe horizontally on mobile.',
  selectedDetail:'Selected point details',date:'Date / time',value:'Rate per 1 JPY',change:'Change from prior',
  rateDate:'Source effective date',source:'Data source',detailTable:'Exchange-rate detail',
  tableHint:'Select a row to highlight the corresponding chart point.',time:'Timestamp',kind:'Data type',
  disclaimer:'Rates are indicative, not bank buy/sell prices. The two months of backfilled history contain daily reference rates, not reconstructed 11:00/19:00 prices. Time-specific points are actual observations collected from the automation start onward. Holidays and weekends may delay new rates.',
  dayReference:'Daily reference rate',observed:'Actual observation',monthAvg:'Monthly average',bad:'Collection failed',
  noData:'No verified data for this period.',live:'Data loaded from source',cached:'Showing saved data',error:'History unavailable',
  noteDaily:'This is the published daily reference rate, not a separate 11:00 or 19:00 market quote.',
  noteObserved:'The time is the actual retrieval time. The source effective date may differ.',
  noteAverage:'Average of available daily reference rates in this month, not a price at one instant.',
  noteNone:'Select a point in the chart or table.',count:'points',viewMonth:'View this month',viewDay:'View this day',
  average:'Monthly avg.',sourceMissing:'No new source rate published today',dataLoaded:'Verified reference data',sourceError:'Provider error',
  previous:'Previous period',next:'Next period'
 }
};
let locale='vi',currency='VND',period='month',focus='2026-10-16',selected=null,daily=[],observations=[],loadState='loading',loadedTo='',lastError='';
const todayJST=()=>new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Tokyo',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
function t(k){return dict[locale]?.[k]||dict.vi[k]||k}
const parse=(s)=>new Date(s+'T12:00:00Z');
function shiftDate(date,n,unit){const d=parse(date);if(unit==='year')d.setUTCFullYear(d.getUTCFullYear()+n);else if(unit==='month')d.setUTCMonth(d.getUTCMonth()+n);else d.setUTCDate(d.getUTCDate()+n);return d.toISOString().slice(0,10)}
function clamp(date){const end=todayJST();return date<initDate?initDate:date>end?end:date}
const localeCode=()=>locale==='ja'?'ja-JP':locale==='en'?'en-US':'vi-VN';
const number=n=>new Intl.NumberFormat(localeCode(),{minimumFractionDigits:currency==='VND'?2:4,maximumFractionDigits:currency==='VND'?3:7}).format(n);
const fullRate=n=>Number.isFinite(n)?number(n)+' '+currency:'—';
const shortRate=n=>Number.isFinite(n)?new Intl.NumberFormat(localeCode(),{maximumFractionDigits:currency==='VND'?2:6}).format(n):'—';
const dateLabel=(d)=>{if(!d)return '—';try{return new Intl.DateTimeFormat(localeCode(),{timeZone:'UTC',year:'numeric',month:'2-digit',day:'2-digit'}).format(parse(d))}catch{return d}};
const monthLabel=d=>new Intl.DateTimeFormat(localeCode(),{timeZone:'UTC',year:'numeric',month:'long'}).format(parse(d));
function periodText(){return period==='year'?focus.slice(0,4):period==='month'?monthLabel(focus):dateLabel(focus)}
function readPrefs(){locale=window.HomeLoanI18n?.language||'vi';try{const c=localStorage.getItem('home-loan-jp-currency');if(['VND','USD','EUR'].includes(c))currency=c}catch(_){}}
const validDaily=(r)=>r&&/^\d{4}-\d{2}-\d{2}$/.test(r.date||'')&&r.date>=initDate&&r.date<=todayJST()&&['VND','USD','EUR'].every(c=>Number.isFinite(Number(r.rates?.[c]))&&Number(r.rates[c])>0);
function normalize(data){
 if(!data||!Array.isArray(data.daily))throw Error('Invalid history dataset');
 daily=data.daily.filter(validDaily).map(r=>({date:r.date,rates:{VND:Number(r.rates.VND),USD:Number(r.rates.USD),EUR:Number(r.rates.EUR)},kind:'daily-reference'})).sort((a,b)=>a.date.localeCompare(b.date));
 observations=Array.isArray(data.observations)?data.observations.filter(o=>o&&/^\d{4}-\d{2}-\d{2}$/.test(o.date||'')&&['11:00','19:00'].includes(o.slot)&&['ok','error'].includes(o.status)).sort((a,b)=>String(a.observedAt).localeCompare(String(b.observedAt))):[];
 loadedTo=data.to||todayJST();lastError=data.historyError||'';
 if(!focus||focus>todayJST()||focus<initDate)focus=todayJST();
 if(daily.length&&focus>daily[daily.length-1].date)focus=daily[daily.length-1].date;
}
async function load(){
 const status=$('data-status');status.textContent=t('loading');loadState='loading';
 const url='/api/fx-history?'+new URLSearchParams({from:initDate,to:todayJST()});
 try{
  const r=await fetch(url,{cache:'no-cache'});if(!r.ok)throw Error('History API unavailable');
  const data=await r.json();normalize(data);
  if(!daily.length&& !observations.length)throw Error('No data received');
  loadState='live';
  try{localStorage.setItem('home-loan-fx-history-cache-v1',JSON.stringify(data))}catch(_){}
 }catch(err){
  try{
   // Browsers can retrieve daily history directly if a serverless route is unavailable.
   const r=await fetch('https://api.frankfurter.dev/v2/rates?'+new URLSearchParams({from:initDate,to:todayJST(),base:'JPY',quotes:'VND,USD,EUR'}));
   if(!r.ok)throw Error('Rate source unavailable');
   const list=await r.json(),map=new Map();
   for(const row of list){
    if(row.base!=='JPY'||!['VND','USD','EUR'].includes(row.quote)||!/^\d{4}-\d{2}-\d{2}$/.test(row.date||'')||!(Number(row.rate)>0))continue;
    if(!map.has(row.date))map.set(row.date,{date:row.date,rates:{}});
    map.get(row.date).rates[row.quote]=Number(row.rate);
   }
   normalize({daily:[...map.values()],observations:[],to:todayJST()});
   if(!daily.length)throw Error('No verified rate dates');
   loadState='live';
  }catch(_){
   try{normalize(JSON.parse(localStorage.getItem('home-loan-fx-history-cache-v1')||'null'));loadState='cached'}
   catch(_){loadState='error';daily=[];observations=[]}
  }
 }
 if(daily.length)focus=clamp(daily[daily.length-1].date);
 render();
}
function points(){
 const entries=daily.filter(d=>Number.isFinite(d.rates[currency])).map(d=>({...d,rate:d.rates[currency]}));
 if(period==='year'){
  const map=new Map();
  for(const r of entries.filter(r=>r.date.startsWith(focus.slice(0,4)))){
   const key=r.date.slice(0,7);
   const m=map.get(key)||{date:key+'-01',key,kind:'monthly-average',sum:0,count:0,rate:0};
   m.sum+=r.rate;m.count++;map.set(key,m);
  }
  return [...map.values()].map(x=>({...x,rate:x.sum/x.count})).sort((a,b)=>a.date.localeCompare(b.date));
 }
 if(period==='month')return entries.filter(x=>x.date.startsWith(focus.slice(0,7)));
 const observationsToday=observations.filter(x=>x.date===focus);
 const observedGood=observationsToday.filter(x=>x.status==='ok'&&Number(x.rates?.[currency])>0)
  .map(o=>({date:o.date,slot:o.slot,rate:Number(o.rates[currency]),kind:'scheduled-observation',observedAt:o.observedAt,effective:o.sourceDates?.[currency]}))
  .sort((a,b)=>String(a.observedAt).localeCompare(String(b.observedAt)));
 if(observedGood.length)return observedGood;
 return entries.filter(x=>x.date===focus);
}
function renderLabels(){
 document.documentElement.lang=locale;
 document.querySelectorAll('[data-t]').forEach(el=>{el.textContent=t(el.dataset.t)});
 $('currency').value=currency;$('currency-duplicate').value=currency;
 $('language').value=locale;
 document.querySelectorAll('[data-period]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.period===period)));
 $('period-label').textContent=periodText();
 $('summary-range').textContent='1 JPY → '+currency+' · '+periodText();
 $('prev').setAttribute('aria-label',t('previous')) ;$('next').setAttribute('aria-label',t('next'));
 const newPrev=shiftDate(focus,-1,period),newNext=shiftDate(focus,1,period);
 $('prev').disabled=newPrev<initDate;$('next').disabled=newNext>todayJST();
 const status=$('data-status');status.textContent=t(loadState);status.classList.toggle('error',loadState==='error');
}
function records(){
 const p=points();
 return p.map((r,i)=>({...r,index:i,delta:i>0?r.rate-p[i-1].rate:null,deltaPct:i>0?(r.rate-p[i-1].rate)/p[i-1].rate*100:null}));
}
function selectPoint(index,scrollToRow=false){
 const data=records();selected=Number.isInteger(index)?index:data.length-1;
 if(selected<0||selected>=data.length)selected=-1;
 draw(data);detail(data);
 document.querySelectorAll('[data-index]').forEach(tr=>tr.classList.toggle('selected',Number(tr.dataset.index)===selected));
 if(scrollToRow&&selected>=0)document.querySelector('tr[data-index="'+selected+'"]')?.scrollIntoView({behavior:'smooth',block:'nearest'});
}
function summary(p){
 const stats=['stat-first','stat-last','stat-min','stat-max'];
 const values=p.length?[p[0].rate,p[p.length-1].rate,Math.min(...p.map(x=>x.rate)),Math.max(...p.map(x=>x.rate))]:[];
 stats.forEach((k,i)=>{$(k).textContent=values.length?fullRate(values[i]):'—'});
 $('count').textContent=p.length+' '+t('count');
}
const ns='http://www.w3.org/2000/svg';
function svgNode(tag,attrs,txt){
 const el=document.createElementNS(ns,tag);
 for(const [k,v] of Object.entries(attrs||{}))el.setAttribute(k,v);
 if(txt!==undefined)el.textContent=txt;
 return el;
}
function draw(p){
 const svg=$('fx-chart');while(svg.firstChild)svg.removeChild(svg.firstChild);
 const wrap=$('chart-scroll');
 if(!p.length){svg.setAttribute('width','100%');svg.setAttribute('viewBox','0 0 900 305');svg.append(svgNode('text',{x:450,y:148,'text-anchor':'middle',fill:'#8292a8','font-size':16},t('noData')));return}
 const W=Math.max(850,(p.length-1)*37+145),H=305,left=76,right=28,top=24,bottom=55;
 svg.style.width=W+'px';svg.setAttribute('viewBox',`0 0 ${W} ${H}`);
 const all=p.map(x=>x.rate),max=Math.max(...all),min=Math.min(...all);
 const range=max-min||Math.max(max*0.002,1e-7),pad=range*0.2;
 const ymin=Math.max(0,min-pad),ymax=max+pad;
 const cx=i=>left+i*(W-left-right)/Math.max(1,p.length-1);
 const cy=v=>top+(H-top-bottom)*(1-(v-ymin)/(ymax-ymin));
 for(let i=0;i<=4;i++){
  const value=ymin+i*(ymax-ymin)/4,y=cy(value);
  svg.append(svgNode('line',{x1:left,y1:y,x2:W-right,y2:y,class:'grid'}));
  svg.append(svgNode('text',{x:left-8,y:y+4,'text-anchor':'end',class:'y-axis'},shortRate(value)));
 }
 const step=Math.max(1,Math.ceil(p.length/9));
 p.forEach((r,i)=>{
  if(i%step===0||i===p.length-1){
   const label=period==='year'?r.key?.slice(5)||r.date.slice(5,7):period==='month'?r.date.slice(8):r.slot||r.date.slice(8);
   svg.append(svgNode('text',{x:cx(i),y:H-25,'text-anchor':'middle',class:'x-axis'},label));
  }
  if(i>0){
   svg.append(svgNode('line',{x1:cx(i-1),y1:cy(p[i-1].rate),x2:cx(i),y2:cy(r.rate),stroke:r.rate>p[i-1].rate?'#20a276':r.rate<p[i-1].rate?'#e56f74':'#3766c8',class:'line'}));
  }
 });
 p.forEach((r,i)=>{
  const n=svgNode('circle',{cx:cx(i),cy:cy(r.rate),r:i===selected?7:5,fill:i===selected?'#284cb3':r.delta>0?'#20a276':r.delta<0?'#e56f74':'#396dca',class:'point'+(i===selected?' selected':''),tabindex:0,role:'button','aria-label':(r.kind==='monthly-average'?r.key:r.observedAt||r.date)+' · '+fullRate(r.rate),'data-index':i});
  n.addEventListener('click',()=>selectPoint(i));
  n.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();selectPoint(i)}});
  svg.append(n);
 });
 if(wrap&&p.length>14&&selected===p.length-1)wrap.scrollLeft=wrap.scrollWidth-wrap.clientWidth;
}
function pointTime(r){
 if(r.kind==='monthly-average')return (r.key||r.date.slice(0,7));
 if(r.kind==='scheduled-observation')return dateLabel(r.date)+' · '+r.slot+' JST ('+(r.observedAt?new Intl.DateTimeFormat(localeCode(),{timeZone:'Asia/Tokyo',hour:'2-digit',minute:'2-digit'}).format(new Date(r.observedAt)):'—')+')';
 return dateLabel(r.date);
}
function deltaString(r){
 if(r.delta===null)return '—';
 const sign=r.delta>0?'+':'';
 return sign+shortRate(r.delta)+' '+currency+' ('+sign+new Intl.NumberFormat(localeCode(),{maximumFractionDigits:3}).format(r.deltaPct)+'%)';
}
function detail(p){
 const r=p[selected];
 $('detail-title').textContent=r?r.kind==='monthly-average'?t('monthAvg'):r.kind==='scheduled-observation'?t('observed'):t('dayReference'):t('selectedDetail');
 $('detail-time').textContent=r?pointTime(r):'—';
 $('detail-rate').textContent=r?fullRate(r.rate):'—';
 $('detail-delta').textContent=r?deltaString(r):'—';
 $('detail-delta').className='delta '+(!r||r.delta===null||r.delta===0?'flat':r.delta>0?'up':'down');
 $('detail-effective').textContent=r?r.kind==='monthly-average'?'—':dateLabel(r.effective||r.date):'—';
 $('detail-source').textContent='Frankfurter';
 $('detail-note').textContent=!r?t('noteNone'):r.kind==='monthly-average'?t('noteAverage')+(r.count?' ('+r.count+' '+t('count')+')':''):r.kind==='scheduled-observation'?t('noteObserved'):t('noteDaily');
 let btn=$('drill');
 if(!btn){btn=document.createElement('button');btn.id='drill';btn.className='arrow';btn.style.cssText='width:100%;font-size:12px;font-weight:750;margin-top:8px';document.querySelector('.detail').append(btn);btn.addEventListener('click',()=>{
    const chosen=records()[selected];if(!chosen)return;
    if(period==='year'){focus=chosen.date;period='month';}
    else if(period==='month'){focus=chosen.date;period='day';}
    render();
  });}
 btn.hidden=!r||period==='day';
 if(r&&period!=='day')btn.textContent=period==='year'?t('viewMonth'):t('viewDay');
}
function table(p){
 const target=$('rows');target.replaceChildren();
 if(!p.length){
  const tr=document.createElement('tr');const td=document.createElement('td');td.colSpan=4;td.className='empty';td.textContent=t('noData');tr.append(td);target.append(tr);return;
 }
 p.slice().reverse().forEach(r=>{
  const tr=document.createElement('tr');tr.dataset.index=String(r.index);tr.className=r.index===selected?'selected':'';
  const labels=[pointTime(r),fullRate(r.rate),deltaString(r),r.kind==='monthly-average'?t('monthAvg'):r.kind==='scheduled-observation'?t('observed'):t('dayReference')];
  labels.forEach((txt,i)=>{const td=document.createElement('td');td.textContent=txt;if(i===2)td.className='delta '+(r.delta>0?'up':r.delta<0?'down':'flat');tr.append(td)});
  tr.addEventListener('click',()=>selectPoint(r.index));
  target.append(tr);
 });
 if(period==='day'){
  observations.filter(o=>o.date===focus&&o.status==='error').forEach(o=>{
   const tr=document.createElement('tr');[dateLabel(o.date)+' · '+o.slot,'—','—',t('bad')].forEach(v=>{const td=document.createElement('td');td.textContent=v;tr.append(td)});target.append(tr);
  });
 }
}
function render(){
 renderLabels();const p=records();
 if(selected===null||selected<0||selected>=p.length)selected=p.length-1;
 summary(p);draw(p);detail(p);table(p);
}
function setCurrency(code){
 if(!currencies.includes(code)||currency===code)return;
 currency=code;try{localStorage.setItem('home-loan-jp-currency',code)}catch(_){}
 selected=null;render();
}
function changePeriod(p){
 if(!['year','month','day'].includes(p))return;
 period=p;
 if(daily.length){
  const latest=daily[daily.length-1].date;
  if(period==='month'&&focus.slice(0,4)!==latest.slice(0,4))focus=latest;
  if(period==='day'&&focus.slice(0,7)===latest.slice(0,7))focus=latest;
 }
 selected=null;render();
}
function setup(){
 readPrefs();
 const initialDate=todayJST();focus=initialDate;
 $('currency').addEventListener('change',e=>setCurrency(e.target.value));
 $('currency-duplicate').addEventListener('change',e=>setCurrency(e.target.value));
 document.querySelectorAll('[data-period]').forEach(el=>el.addEventListener('click',()=>changePeriod(el.dataset.period)));
 $('prev').addEventListener('click',()=>{focus=clamp(shiftDate(focus,-1,period));selected=null;render()});
 $('next').addEventListener('click',()=>{focus=clamp(shiftDate(focus,1,period));selected=null;render()});
 document.addEventListener('home-loan-language-change',e=>{locale=e.detail?.language||window.HomeLoanI18n?.language||'vi';render()});
 render();load();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',setup,{once:true});else setup();
})();
