const V="cicerone-2026.08.21-1627";
const SHELL=["./","index.html"];
self.addEventListener("install",e=>{ e.waitUntil(caches.open(V).then(c=>c.addAll(SHELL)).then(()=>self.skipWaiting())); });
self.addEventListener("activate",e=>{ e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==V).map(k=>caches.delete(k)))).then(()=>self.clients.claim())); });
self.addEventListener("fetch",e=>{
  const req=e.request;
  if(req.method!=="GET") return;
  const u=req.url;
  if(/api\.anthropic|photon\.komoot|api\.elevenlabs|routing\.openstreetmap/.test(u)) return; // AI + geocoding + routing: network only
  if(req.mode==="navigate"){
    e.respondWith(fetch(req).then(r=>{ const cp=r.clone(); caches.open(V).then(c=>c.put(req,cp)); return r; })
      .catch(()=>caches.match(req).then(r=>r||caches.match("index.html"))));
    return;
  }
  if(/upload\.wikimedia|wikipedia\.org|wikimedia\.org|openfreemap|fonts\.g|cdnjs/.test(u)){
    // stale-while-revalidate for images, tiles, fonts, libs
    e.respondWith(caches.match(req).then(hit=>{
      const net=fetch(req).then(r=>{ if(r&&r.ok){ const cp=r.clone(); caches.open(V).then(c=>c.put(req,cp)); } return r; }).catch(()=>hit);
      return hit||net;
    }));
    return;
  }
  e.respondWith(caches.match(req).then(hit=>hit||fetch(req).then(r=>{ if(r&&r.ok&&new URL(u).origin===location.origin){ const cp=r.clone(); caches.open(V).then(c=>c.put(req,cp)); } return r; })));
});
