export function ema(a,n){let v=a[0];return a.map(x=>(v=x*2/(n+1)+v*(1-2/(n+1))))}
export function rsi(a,n=14){let u=0,d=0;return a.map((x,i)=>{if(!i)return null;let delta=x-a[i-1];if(i<=n){u+=Math.max(delta,0)/n;d+=Math.max(-delta,0)/n}else{u=(u*(n-1)+Math.max(delta,0))/n;d=(d*(n-1)+Math.max(-delta,0))/n}return i<n?null:d===0?(u===0?50:100):100-100/(1+u/d)})}
export function indicators(bars){let c=bars.map(b=>b.c),atr=[],v=0;bars.forEach((b,i)=>{let p=i?bars[i-1].c:b.o,tr=Math.max(b.h-b.l,Math.abs(b.h-p),Math.abs(b.l-p));if(i<14)v+=tr/14;else v=(13*v+tr)/14;atr.push(i<13?null:v)});return {e20:ema(c,20),e50:ema(c,50),rsi:rsi(c),atr,vol:bars.map((b,i)=>i<20?null:b.v/(bars.slice(i-20,i).reduce((a,b)=>a+b.v,0)/20))}}
export function signals(bars,ind,i){return i>=60&&bars[i].c>ind.e20[i]&&ind.e20[i]>ind.e50[i]&&ind.rsi[i]>=40&&ind.rsi[i]<=70&&ind.vol[i]>=1.5}
export function adjusted(raw){return raw.map(b=>{const f=b.adj/b.c;return {...b,o:b.o*f,h:b.h*f,l:b.l*f,c:b.adj}})}
export function backtest(raw,options={}){
 const cost=options.costBps??10,risk=options.riskPct??0.5,start=options.start||raw[60]?.date,end=options.end||raw.at(-1)?.date;
 if(!Number.isFinite(cost)||cost<0||cost>100||!Number.isFinite(risk)||risk<=0||risk>10)throw Error('成本须为0–100基点，风险预算须为0–10%。');
 if(!start||!end||start>end)throw Error('回测日期范围无效');
 if(raw.length<120)throw Error('历史数据不足120根，无法回测');
 const bars=adjusted(raw),ind=indicators(bars),first=bars.findIndex(b=>b.date>=start),last=bars.findLastIndex(b=>b.date<=end);if(first<60||last-first<30)throw Error('需要至少60根预热数据和30个回测交易日');
 let cash=10000,units=0,entry=null,stop=0,peak=10000,maxDD=0,trades=[],curve=[],benchmarkUnits=10000/(bars[first].o*(1+cost/10000));const fee=cost/10000;
 const sell=(p,b,reason)=>{let value=units*p*(1-fee),pnl=value-entry.cash;cash+=value;trades.push({entryDate:entry.date,exitDate:b.date,entry:entry.price,exit:p,units,pnl,returnPct:pnl/entry.cash*100,reason});units=0;entry=null;};
 for(let i=first;i<=last;i++){
  let b=bars[i],prev=i-1;
  if(units){if(b.o<=stop)sell(b.o,b,'跳空止损');else if(bars[prev].c<ind.e20[prev])sell(b.o,b,'前日收盘跌破EMA20');}
  else if(signals(bars,ind,prev)){let distance=2*ind.atr[prev],equity=cash;units=Math.min(equity*risk/100/distance,cash/(b.o*(1+fee)));let spend=units*b.o*(1+fee);cash-=spend;entry={price:b.o,date:b.date,cash:spend};stop=b.o-distance;}
  if(units&&b.l<=stop)sell(stop,b,'盘中触及固定2ATR止损');
  if(i===last&&units)sell(b.c,b,'区间末收盘结算');
  let equity=cash+units*b.c;peak=Math.max(peak,equity);maxDD=Math.max(maxDD,1-equity/peak);curve.push({date:b.date,equity,benchmark:benchmarkUnits*b.c*(i===last?1-fee:1)});
 }
 const final=curve.at(-1),days=(Date.parse(bars[last].date)-Date.parse(bars[first].date))/86400000,years=days/365.25,returns=curve.map((x,i)=>x.equity/(i?curve[i-1].equity:10000)-1),mean=returns.reduce((a,b)=>a+b,0)/returns.length,sd=Math.sqrt(returns.reduce((a,b)=>a+(b-mean)**2,0)/Math.max(1,returns.length-1));
 return {from:bars[first].date,to:bars[last].date,costBps:cost,riskPct:risk,totalReturn:(final.equity/10000-1)*100,cagr:years>0?((final.equity/10000)**(1/years)-1)*100:null,maxDrawdown:maxDD*100,benchmarkReturn:(final.benchmark/10000-1)*100,sharpe:sd>0?mean/sd*Math.sqrt(252):null,winRate:trades.length?trades.filter(t=>t.pnl>0).length/trades.length*100:null,trades,curve,initial:10000};
}
