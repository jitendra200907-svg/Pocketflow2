const CACHE="pocketflow-v3";
const ASSETS=["./","./index.html","./manifest.webmanifest","./sw.js","./icon-192.png","./icon-512.png"];
self.addEventListener("install",e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting()))});
self.addEventListener("activate",e=>{e.waitUntil(self.clients.claim())});
self.addEventListener("fetch",e=>{
  const u=new URL(e.request.url);
  if(e.request.method==="POST" && (u.pathname.endsWith("/share-target") || u.pathname.endsWith("/share-target/"))){
    e.respondWith(handleShare(e.request));
    return;
  }
  if(e.request.method==="GET"){
    e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request).then(x=>{
      const copy=x.clone(); caches.open(CACHE).then(c=>c.put(e.request,copy)); return x;
    }).catch(()=>caches.match("./index.html"))));
  }
});
async function handleShare(request){
  try{
    const fd=await request.formData();
    const file=fd.get("receipt");
    if(file && file.type && file.type.startsWith("image/")){
      const db=await openDB();
      await putFile(db,{blob:file,name:file.name,type:file.type});
    }
  }catch(e){}
  return Response.redirect("./index.html?shared=1",303);
}
function openDB(){
 return new Promise((resolve,reject)=>{
  const r=indexedDB.open("PocketFlowShare",1);
  r.onupgradeneeded=()=>r.result.createObjectStore("files",{keyPath:"id",autoIncrement:true});
  r.onsuccess=()=>resolve(r.result); r.onerror=()=>reject(r.error);
 });
}
function putFile(db,obj){
 return new Promise((resolve,reject)=>{
  const tx=db.transaction("files","readwrite"); tx.objectStore("files").add(obj);
  tx.oncomplete=()=>resolve(); tx.onerror=()=>reject(tx.error);
 });
}