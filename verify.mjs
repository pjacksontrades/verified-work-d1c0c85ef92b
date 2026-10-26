import fs from 'node:fs';
import assert from 'node:assert/strict';
import {holderProof,percentage} from './holder-proof.mjs';
const e=JSON.parse(fs.readFileSync(new URL('./evidence.json',import.meta.url))),p=holderProof(e.proof.rows,e.proof.total);
assert.equal(p.proven,true);assert.equal(String(p.residual),e.proof.residual);assert.equal(String(p.top20),e.proof.top20);
assert.deepEqual(p.top.map(r=>r.address),e.proof.top.map(r=>r.address));
const cutoff=Date.parse(e.cutoff??'2026-10-24T05:00:00Z')/1000;
assert.ok(Number(BigInt(e.snapshot.timestamp))<cutoff&&Number(BigInt(e.nextBlock.timestamp))>=cutoff);
assert.equal(BigInt(e.nextBlock.number),BigInt(e.snapshot.number)+1n);
assert.equal(BigInt(e.discovery.supply),p.total);
if(process.argv.includes('--live')){
 const rpcURL=process.env.BSC_RPC_URL??e.discovery.rpc;const parsed=new URL(rpcURL);assert.equal(parsed.protocol,'https:');
 let id=0;async function rpc(method,params){await new Promise(r=>setTimeout(r,1300));const r=await fetch(rpcURL,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({jsonrpc:'2.0',id:++id,method,params}),signal:AbortSignal.timeout(25000)});assert.ok(r.ok,'RPC HTTP '+r.status);const d=await r.json();assert.equal(d.error,undefined,'RPC error (not accepted as missing data)');return d.result;}
 assert.equal(await rpc('eth_chainId',[]),'0x38');const b=e.snapshot.number,token=e.discovery.token;
 const pinned=await rpc('eth_getBlockByNumber',[b,false]);assert.equal(pinned.hash,e.snapshot.hash);assert.equal(pinned.timestamp,e.snapshot.timestamp);
 const next=await rpc('eth_getBlockByNumber',[e.nextBlock.number,false]);assert.equal(next.timestamp,e.nextBlock.timestamp);
 assert.equal(BigInt(await rpc('eth_call',[{to:token,data:'0x18160ddd'},b])),p.total);
 for(const row of p.rows)assert.equal(BigInt(await rpc('eth_call',[{to:token,data:'0x70a08231'+row.address.slice(2).padStart(64,'0')},b])),row.balance,'Balance differs: '+row.address);
 for(const row of e.proof.top)assert.equal(await rpc('eth_getCode',[row.address,b]),row.code,'Code differs: '+row.address);
 console.log('All historical state reads independently matched.');
}
console.log(JSON.stringify({verified:true,block:e.discovery.snapshot,checked:p.checked,residual:p.residual.toString(),rank20:p.threshold.toString(),top20Percent:percentage(p.top20,p.total)}));
