import test from 'node:test';
import assert from 'node:assert/strict';
import {apiJson,pagesOrigin} from '../lib/cors.mjs';
test('GitHub origin can read success and error responses without credentials',async()=>{
 for(const status of [200,400,502]){
  const r=apiJson(new Request('https://example.test/api/market',{headers:{Origin:pagesOrigin}}),{ok:status===200},{status,headers:{'Cache-Control':'no-store'}});
  assert.equal(r.status,status);assert.equal(r.headers.get('Access-Control-Allow-Origin'),pagesOrigin);
  assert.equal(r.headers.get('Access-Control-Allow-Credentials'),null);assert.equal(r.headers.get('Cache-Control'),'no-store');assert.equal(r.headers.get('Vary'),'Origin');
 }
});
test('other origins receive no CORS grant',()=>{
 for(const origin of ['https://evil.test',pagesOrigin+'.evil.test','null','']){
 const r=apiJson(new Request('https://example.test/api/news',{headers:{Origin:origin}}),{});
 assert.equal(r.headers.get('Access-Control-Allow-Origin'),null);
 }
});
