import {ema,rsi} from './engine.mjs';
export function shortIndicators(bars){let pv=0,volume=0,session;const vwap=bars.map(b=>{if(b.session!==session){session=b.session;pv=0;volume=0}pv+=(b.h+b.l+b.c)/3*b.v;volume+=b.v;return volume?pv/volume:null});let c=bars.map(b=>b.c);return {fast:ema(c,9),slow:ema(c,21),rsi:rsi(c),vwap};}
export function shortSignal(data,now=Date.now()){
 const bars=data.bars,ind=shortIndicators(bars),i=bars.length-1,b=bars[i];const open=data.session?now>=Date.parse(data.session.start)&&now<Date.parse(data.session.end):false;
 const stale=!data.quote?.time||now-Date.parse(data.quote.time)>600000||now-Date.parse(data.asOf)>900000||now-Date.parse(data.fetchedAt)>600000;
 const up=b.c>ind.fast[i]&&ind.fast[i]>ind.slow[i]&&b.c>ind.vwap[i]&&ind.rsi[i]>=50&&ind.rsi[i]<=70;
 const down=b.c<ind.fast[i]&&ind.fast[i]<ind.slow[i]&&b.c<ind.vwap[i]&&ind.rsi[i]<=50&&ind.rsi[i]>=30;
 return {ind,open,stale,label:!open?'常规时段外 · 历史参考':stale?'行情滞后 · 暂停判断':up?'超短线偏强':down?'超短线偏弱':'震荡 / 等待确认',bias:up?'up':down?'down':'neutral'};
}
