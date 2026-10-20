import {intraday} from '../../../lib/providers';
import {symbolOK} from '../../../lib/market.mjs';
export async function GET(req:Request){const s=new URL(req.url).searchParams.get('symbol')||'';if(!symbolOK(s))return Response.json({error:'股票代码格式不正确'},{status:400});try{return Response.json(await intraday(s),{headers:{'Cache-Control':'no-store'}})}catch{return Response.json({error:'5分钟行情暂不可用；请稍后重试。超短线信号暂停。'},{status:502})}}
