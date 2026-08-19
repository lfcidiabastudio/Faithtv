const CACHE="faithtv-v5";
const STATIC=["./","./index.html","./install.html","./styles.css","./app.js","./config.js","./manifest.webmanifest","./faithtv-logo.png","./winners-cropped.svg","./winners-white-cropped.svg","./icon-192.png","./icon-512.png","./icon-maskable-512.png"];
self.addEventListener("install",e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(STATIC)).then(()=>self.skipWaiting())));
self.addEventListener("activate",e=>e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener("fetch",e=>{
 const req=e.request;
 if(req.method!=="GET")return;
 const u=new URL(req.url);
 if(u.pathname.endsWith(".xsl")||u.pathname==="/faithtv")return;
 if(req.mode==="navigate"||STATIC.some(a=>{const x=new URL(a,self.location.origin).pathname;return u.pathname===x})){
  e.respondWith(fetch(req).then(r=>{const c=r.clone();caches.open(CACHE).then(x=>x.put(req,c));return r}).catch(()=>caches.match(req).then(m=>m||caches.match("./"))));
 }
});
