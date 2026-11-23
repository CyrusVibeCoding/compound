import {readdir,readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
async function walk(path){const out=[];for(const e of await readdir(path,{withFileTypes:true})){const p=`${path}/${e.name}`;if(e.isDirectory())out.push(...await walk(p));else if(e.name!=='sw.js')out.push(p)}return out}
const files=await walk('dist');const hash=createHash('sha256');for(const f of files)hash.update(await readFile(f));const cache=`compound-${hash.digest('hex').slice(0,12)}`;const urls=['./',...files.map(p=>'./'+p.slice(5))];
await writeFile('dist/sw.js',`const CACHE=${JSON.stringify(cache)};const ROOT=new URL('./',self.location.href).href;const URLS=${JSON.stringify(urls)}.map(p=>new URL(p,ROOT).href);
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(URLS)));self.skipWaiting()});
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k.startsWith('compound-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{if(e.request.method!=='GET'||!e.request.url.startsWith(ROOT))return;e.respondWith(fetch(e.request).then(r=>{if(r.ok){const c=r.clone();e.waitUntil(caches.open(CACHE).then(cache=>cache.put(e.request,c)))}return r}).catch(()=>caches.match(e.request).then(c=>c||(e.request.mode==='navigate'?caches.match(ROOT):Response.error()))))});`);
console.log(`Offline cache: ${urls.length} files (${cache})`);
