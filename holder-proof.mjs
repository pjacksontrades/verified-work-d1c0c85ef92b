export const ADDRESS=/^0x[0-9a-f]{40}$/i;
export function units(n,decimals=18){n=BigInt(n);const sign=n<0n?'-':'';if(n<0n)n=-n;const p=10n**BigInt(decimals);return sign+n/p+'.'+(n%p).toString().padStart(decimals,'0');}
export function percentage(n,total,places=12){n=BigInt(n);total=BigInt(total);if(n<0n||total<=0n)throw Error('Invalid share');return units(n*100n*10n**BigInt(places)/total,places);}
export function holderProof(input,total,count=20){
 total=BigInt(total);if(total<=0n)throw Error('Supply must be positive');
 const seen=new Set();const rows=input.map(r=>{const address=r.address?.toLowerCase();if(!ADDRESS.test(address)||/^0x0{40}$/.test(address)||seen.has(address))throw Error('Invalid or duplicate holder');seen.add(address);const balance=BigInt(r.balance);if(balance<0n)throw Error('Negative balance');return {...r,address,balance};});
 rows.sort((a,b)=>a.balance>b.balance?-1:a.balance<b.balance?1:a.address.localeCompare(b.address));
 const accounted=rows.reduce((s,r)=>s+r.balance,0n),residual=total-accounted;
 if(residual<0n)throw Error('Balances exceed supply; no valid conservation proof');
 const top=rows.filter(r=>r.balance>0n).slice(0,count),threshold=top.at(-1)?.balance??0n;
 const proven=top.length===count&&residual<threshold;
 return {proven,total,accounted,residual,threshold,checked:rows.length,top,top5:top.slice(0,5).reduce((s,r)=>s+r.balance,0n),top10:top.slice(0,10).reduce((s,r)=>s+r.balance,0n),top20:top.reduce((s,r)=>s+r.balance,0n),rows};
}
