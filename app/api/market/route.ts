import {apiJson} from '../../../lib/cors.mjs';
import {market} from '../../../lib/providers';
import {symbolOK} from '../../../lib/market.mjs';
export async function GET(req:Request){const s=new URL(req.url).searchParams.get('symbol')||'';if(!symbolOK(s))return apiJson(req,{error:'股票代码格式不正确'},{status:400});try{return apiJson(req,await market(s),{headers:{'Cache-Control':'no-store'}})}catch{return apiJson(req,{error:'行情源暂不可用、限流或股票不存在；请重试或检查代码。'},{status:502})}}
