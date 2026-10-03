/* Service Worker: macht den Haushaltsplan offline startbar.
   Eigene Dateien: zuerst aus dem Netz (damit Updates sofort ankommen), sonst aus dem Speicher.
   Firebase-Bibliotheken: aus dem Speicher (die Adresse enthält die Version).
   Datenbank und Anmeldung laufen nicht über diesen Speicher, das übernimmt Firebase selbst. */
const CACHE='haushalt-v1';
const FILES=['./','index.html','manifest.json','icon-192.png','icon-512.png','icon-maskable.png','apple-touch-icon.png'];
const LIBS=['firebase-app-compat.js','firebase-auth-compat.js','firebase-firestore-compat.js'].map(f=>'https://www.gstatic.com/firebasejs/10.12.2/'+f);

self.addEventListener('install',e=>{
 e.waitUntil(caches.open(CACHE).then(c=>Promise.all([
  c.addAll(FILES),
  ...LIBS.map(u=>fetch(u,{mode:'no-cors'}).then(r=>c.put(u,r)).catch(()=>{}))
 ])).then(()=>self.skipWaiting()));
});

self.addEventListener('activate',e=>{
 e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});

self.addEventListener('fetch',e=>{
 const req=e.request;if(req.method!=='GET')return;
 const url=new URL(req.url);
 if(url.origin===location.origin){
  const key=url.origin+url.pathname;
  e.respondWith(fetch(req).then(r=>{
   if(r.ok){const copy=r.clone();caches.open(CACHE).then(c=>c.put(key,copy))}
   return r;
  }).catch(()=>caches.match(key).then(r=>r||(req.mode==='navigate'?caches.match('./'):undefined)).then(r=>r||Response.error())));
  return;
 }
 if(url.hostname==='www.gstatic.com'&&url.pathname.startsWith('/firebasejs/')){
  e.respondWith(caches.match(req.url).then(r=>r||fetch(req).then(n=>{const copy=n.clone();caches.open(CACHE).then(c=>c.put(req.url,copy));return n})));
 }
});
