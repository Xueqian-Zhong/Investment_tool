export const symbolOK = s => typeof s === 'string' && /^[A-Z][A-Z0-9.-]{0,9}$/.test(s);
export const nyDate = (d = new Date()) => new Intl.DateTimeFormat('en-CA',{timeZone:'America/New_York',year:'numeric',month:'2-digit',day:'2-digit'}).format(d);
export function normalizeYahoo(json, now = new Date()) {
 const data=json?.chart?.result?.[0];if(!data?.timestamp?.length)throw Error('该股票无可用历史行情');
 const q=data.indicators?.quote?.[0],adj=data.indicators?.adjclose?.[0]?.adjclose;if(!q||!adj)throw Error('缺少复权价格，无法进行可信回测');
 const today=nyDate(now), end=data.meta?.currentTradingPeriod?.regular?.end;
 const bars=data.timestamp.map((t,i)=>({date:nyDate(new Date(t*1000)),o:q.open[i],h:q.high[i],l:q.low[i],c:q.close[i],v:q.volume[i],adj:adj[i]})).filter(b=>b.date<=today && (b.date<today || (end && now.getTime()/1000>end+900)) && [b.o,b.h,b.l,b.c,b.adj].every(n=>Number.isFinite(n)&&n>0)&&Number.isFinite(b.v)&&b.v>=0&&b.h>=Math.max(b.o,b.c)&&b.l<=Math.min(b.o,b.c));
 if(bars.length<60)throw Error('有效日线少于60根，无法分析');
 const dates=new Set();for(const b of bars){if(dates.has(b.date))throw Error('行情日期重复');dates.add(b.date)}bars.sort((a,b)=>a.date.localeCompare(b.date));
 return {symbol:data.meta.symbol,name:data.meta.longName||data.meta.shortName||data.meta.symbol,currency:data.meta.currency,exchange:data.meta.fullExchangeName,quote:{price:data.meta.regularMarketPrice,time:data.meta.regularMarketTime?new Date(data.meta.regularMarketTime*1000).toISOString():null},bars,source:'Yahoo Finance 公开行情',sourceUrl:`https://finance.yahoo.com/quote/${encodeURIComponent(data.meta.symbol)}/history/`,fetchedAt:now.toISOString(),asOf:bars.at(-1).date,adjustment:'Yahoo Adjusted Close / Close 比例统一调整 OHLC；回测为分红再投资代理，不是实际逐笔成交账本。',warnings:['日线仅使用已结束交易时段；公开行情可能延迟。','仅覆盖当前关注股票，存在幸存者与选股偏差。']};
}
export function parseRSS(xml){
 const decode=s=>s.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g,'$1').replace(/<[^>]*>/g,'').replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&apos;/g,"'").replace(/&lt;/g,'<').replace(/&gt;/g,'>');
 const field=(s,n)=>decode((s.match(new RegExp(`<${n}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${n}>`,'i'))||[])[1]||'').trim();
 const seen=new Set();return [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].map(m=>{let body=m[1],url=field(body,'link'),title=field(body,'title'),pub=field(body,'pubDate');let time=Date.parse(pub);return {title,url,publishedAt:Number.isFinite(time)?new Date(time).toISOString():null,source:field(body,'source')||'Yahoo Finance RSS 聚合',category:/earnings|revenue|profit|quarter/i.test(title)?'earnings':/fed|rate|inflation|economy/i.test(title)?'macro':'company'};}).filter(n=>{let key=n.title.toLowerCase().replace(/\W/g,'');if(!n.title||!/^https:\/\//.test(n.url)||seen.has(key))return false;seen.add(key);return true}).sort((a,b)=>(b.publishedAt||'').localeCompare(a.publishedAt||'')).slice(0,20);
}
export function normalizeIntraday(json, now=new Date()){
 const d=json?.chart?.result?.[0],q=d?.indicators?.quote?.[0];if(!q||!d.timestamp?.length)throw Error('没有可用的5分钟行情');
 const nowSec=now.getTime()/1000,session=d.meta.currentTradingPeriod?.regular;
 const format=t=>new Intl.DateTimeFormat('en-CA',{timeZone:'America/New_York',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hour12:false}).format(new Date(t*1000));
 const bars=d.timestamp.map((t,i)=>({t,date:format(t),session:nyDate(new Date(t*1000)),o:q.open[i],h:q.high[i],l:q.low[i],c:q.close[i],v:q.volume[i]})).filter(b=>b.t%300===0&&b.t+300<=nowSec&&[b.o,b.h,b.l,b.c].every(n=>Number.isFinite(n)&&n>0)&&Number.isFinite(b.v)&&b.v>=0&&b.h>=Math.max(b.o,b.c)&&b.l<=Math.min(b.o,b.c)).sort((a,b)=>a.t-b.t);
 if(bars.length<30)throw Error('已完成5分钟K线不足30根');
 if(new Set(bars.map(b=>b.t)).size!==bars.length)throw Error('行情时间重复');
 return {symbol:d.meta.symbol,bars,quote:{price:d.meta.regularMarketPrice,time:d.meta.regularMarketTime?new Date(d.meta.regularMarketTime*1000).toISOString():null},session:session?{start:new Date(session.start*1000).toISOString(),end:new Date(session.end*1000).toISOString()}:null,marketState:session&&nowSec>=session.start&&nowSec<session.end?'regular':'outside_regular',asOf:new Date((bars.at(-1).t+300)*1000).toISOString(),fetchedAt:now.toISOString(),source:'Yahoo Finance 5分钟公开行情',delaySeconds:Number.isFinite(d.meta.exchangeDataDelayedBy)?d.meta.exchangeDataDelayedBy:null};
}
