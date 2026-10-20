import {apiJson} from '../../../lib/cors.mjs';
import {news} from '../../../lib/providers';
import {symbolOK} from '../../../lib/market.mjs';
export async function GET(req:Request){const s=new URL(req.url).searchParams.get('symbol')||'';if(!symbolOK(s))return apiJson(req,{error:'股票代码格式不正确'},{status:400});try{return apiJson(req,await news(s),{headers:{'Cache-Control':'private, max-age=300'}})}catch{return apiJson(req,{error:'新闻公开源暂不可用，请稍后重试。'},{status:502})}}
