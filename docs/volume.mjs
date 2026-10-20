import {shortSignal} from './short.mjs';
const avg=a=>a.length?a.reduce((s,x)=>s+x,0)/a.length:null;
const slot=t=>new Intl.DateTimeFormat('en-GB',{timeZone:'America/New_York',hour:'2-digit',minute:'2-digit',hour12:false}).format(new Date(t*1000));
export function volumeAnalysis(data,{now=Date.now(),failed=false}={}){
 const bars=data.bars,last=bars.at(-1),ss=shortSignal(data,now),today=bars.filter(b=>b.session===last.session),v=ss.ind.vwap,offset=bars.length-today.length;
 const peers=bars.filter(b=>b.session!==last.session&&slot(b.t)===slot(last.t)),baseline=avg(peers.map(b=>b.v)),rvol=peers.length>=3&&baseline>0?last.v/baseline:null;
 const prev=today.at(-2),position=last.h>last.l?(last.c-last.l)/(last.h-last.l):null;
 const above=today.length>=3&&today.slice(-3).every((b,k)=>v[bars.length-3+k]!=null&&b.c>v[bars.length-3+k]);
 let retests=0,lastTouch=-99;for(let j=Math.max(0,today.length-12);j<today.length;j++){let vw=v[offset+j],b=today[j];if(vw!=null&&b.l<=vw*1.002&&b.l>=vw*.995&&b.c>vw&&j-lastTouch>=3){retests++;lastTouch=j}}
 const checks=[{name:'同时间段放量 ≥1.5×',ok:rvol===null?null:rvol>=1.5},{name:'最新收盘高于上一根5分钟收盘',ok:prev?last.c>prev.c:null},{name:'收盘位于本根振幅顶部30%',ok:position===null?null:position>=.7},{name:'连续3根收盘高于当日VWAP',ok:today.length>=3?above:null},{name:'最近12根至少2次VWAP附近回踩守住',ok:today.length>=12?retests>=2:null}];
 const count=checks.filter(c=>c.ok===true).length,ready=checks.every(c=>c.ok!==null),active=!failed&&ss.open&&!ss.stale&&ready;
 const label=failed?'刷新失败 · 暂停判断':!ss.open?'常规时段外 · 历史参考':ss.stale?'行情滞后 · 暂停判断':!ready?'样本不足 · 暂不判断':count>=4&&checks[0].ok&&checks[1].ok&&last.c>v.at(-1)?'疑似资金积累 · 待验证':count>=3?'部分量价条件满足':'暂未发现一致积累线索';
 const previous20=today.slice(-21,-1),breakout=previous20.length===20&&rvol!==null?last.c>Math.max(...previous20.map(b=>b.h))&&rvol>=1.5:null;
 const recent=today.slice(-3),prior=today.slice(-6,-3),pullback=today.length>=6&&avg(prior.map(b=>b.v))>0?last.c<prior.at(-1).c&&avg(recent.map(b=>b.v))<=avg(prior.map(b=>b.v))*.7&&last.c>v.at(-1):null;
 const a=today.slice(-6),b=today.slice(-12,-6),divergence=today.length>=12&&avg(b.map(b=>b.v))>0?Math.max(...a.map(b=>b.h))>Math.max(...b.map(b=>b.h))&&avg(a.map(b=>b.v))<avg(b.map(b=>b.v))*.8:null;
 return {label,count,checks,active,rvol,peerCount:peers.length,baseline,volume:last.v,totalVolume:today.reduce((s,b)=>s+b.v,0),retests,breakout,pullback,divergence,asOf:data.asOf,bars:today.slice(-24),vwap:v.at(-1),position};
}
export function dailyVolume(bars){if(bars.length<21)return null;let last=bars.at(-1),base=avg(bars.slice(-21,-1).map(b=>b.v)),obv=[0];for(let i=1;i<bars.length;i++)obv.push(obv.at(-1)+Math.sign(bars[i].c-bars[i-1].c)*bars[i].v);let recent=bars.slice(-10),previous=bars.slice(-20,-10);return {volume:last.v,rvol:base>0?last.v/base:null,obvChange:obv.at(-1)-obv.at(-11),divergence:Math.max(...recent.map(b=>b.h))>Math.max(...previous.map(b=>b.h))&&Math.max(...obv.slice(-10))<Math.max(...obv.slice(-20,-10)),asOf:last.date};}
