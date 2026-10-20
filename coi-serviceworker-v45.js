'use strict';
const CHUNK_SIZE=16777216;
const PACKS={'Text.pak':24846904,'Sprite00.pak':218172787};
self.addEventListener('install',event=>event.waitUntil(self.skipWaiting()));
self.addEventListener('activate',event=>event.waitUntil(self.clients.claim()));
const iso=(extra={})=>new Headers({
  'Cross-Origin-Embedder-Policy':'require-corp',
  'Cross-Origin-Opener-Policy':'same-origin',
  'Cross-Origin-Resource-Policy':'same-origin',
  ...extra
});
async function rangeResponse(req,name) {
  const total=PACKS[name];
  const accept={'Accept-Ranges':'bytes','Content-Type':'application/octet-stream','Cache-Control':'no-store'};
  if(req.method==='HEAD'){
    return new Response(null,{status:200,headers:iso({...accept,'Content-Length':String(total)})});
  }
  if(req.method!=='GET')return new Response('Method not allowed',{status:405});
  const match=/^bytes=(\d+)-(\d*)$/.exec(req.headers.get('range')||'');
  if(!match)return new Response('Range required',{status:416});
  const from=Number(match[1]);
  const to=match[2] ? Number(match[2]):Math.min(total-1,from+1048575);
  if(!Number.isSafeInteger(from)||!Number.isSafeInteger(to)||from<0||to<from||to>=total||to-from>2097151){
    return new Response('Bad byte range',{status:416,headers:iso({'Content-Range':'bytes */'+total})});
  }
  const result=new Uint8Array(to-from+1);
  let position=from;
  while(position<=to){
    const chunkNo=Math.floor(position/CHUNK_SIZE);
    const localOffset=position%CHUNK_SIZE;
    const count=Math.min(to-position+1,CHUNK_SIZE-localOffset);
    const chunkName='pakchunks/'+name+'.part'+String(chunkNo).padStart(3,'0');
    const url=new URL(chunkName,self.registration.scope);
    const response=await fetch(url,{
      headers:{Range:'bytes='+localOffset+'-'+(localOffset+count-1)},
      cache:'force-cache'
    });
    if(!response.ok || (response.status!==200 && response.status!==206)){
      throw Error('Original PAK shard unavailable: '+chunkName+' ('+response.status+')');
    }
    const bytes=new Uint8Array(await response.arrayBuffer());
    const data=response.status===206?bytes:bytes.subarray(localOffset,localOffset+count);
    if(data.length!==count)throw Error('Incorrect PAK shard length: '+chunkName);
    result.set(data,position-from);
    position+=count;
  }
  return new Response(result,{status:206,headers:iso({
    ...accept,'Content-Length':String(result.byteLength),
    'Content-Range':'bytes '+from+'-'+to+'/'+total
  })});
}
self.addEventListener('fetch',event=>{
  const req=event.request;
  const u=new URL(req.url);
  if(u.origin!==self.location.origin)return;
  const packPrefix=new URL('v45pak/',self.registration.scope).pathname;
  if(u.pathname.startsWith(packPrefix)){
    const name=decodeURIComponent(u.pathname.slice(packPrefix.length));
    if(!Object.prototype.hasOwnProperty.call(PACKS,name)){
      event.respondWith(Promise.resolve(new Response('Original PAK not published in V45',{status:404})));
    }else{
      event.respondWith(rangeResponse(req,name).catch(e=>{
        console.error('V45 PAK range:',e);
        return new Response(String(e),{status:502});
      }));
    }
    return;
  }
  event.respondWith(fetch(req).then(res=>{
    if(!res.ok || res.type==='opaque')return res;
    const headers=new Headers(res.headers);
    headers.set('Cross-Origin-Embedder-Policy','require-corp');
    headers.set('Cross-Origin-Opener-Policy','same-origin');
    headers.set('Cross-Origin-Resource-Policy','same-origin');
    return new Response(res.body,{status:res.status,statusText:res.statusText,headers});
  }));
});
