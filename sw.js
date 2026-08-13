// The Stock Soup — service worker for web push (#315).
// Payloadless push: the push event carries no data (we don't do aes128gcm encryption in the Worker),
// so on each push we fetch the specific alert text for THIS subscription from /push/pending, then show
// it. The endpoint URL is the capability secret, so no auth token is needed from the SW.
const API = 'https://stocksoup-api.defranceski.workers.dev';

self.addEventListener('install', function(){ self.skipWaiting(); });
self.addEventListener('activate', function(e){ e.waitUntil(self.clients.claim()); });

self.addEventListener('push', function(event){
  event.waitUntil((async function(){
    var title = '🎯 Ready to buy', body = 'A pick or a watched name hit its buy zone — tap to see which.', url = '/';
    try{
      var sub = await self.registration.pushManager.getSubscription();
      if(sub){
        var r = await fetch(API + '/push/pending', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ endpoint: sub.endpoint }) });
        if(r.ok){ var j = await r.json(); if(j.title) title = j.title; if(j.body) body = j.body; if(j.url) url = j.url; }
      }
    }catch(e){}
    await self.registration.showNotification(title, {
      body: body, icon: 'icon-192.png', badge: 'icon-192.png',
      tag: 'buyzone', renotify: true, data: { url: url }, vibrate: [120,60,120]
    });
  })());
});

self.addEventListener('notificationclick', function(event){
  event.notification.close();
  var url = (event.notification.data && event.notification.data.url) || '/';
  event.waitUntil((async function(){
    var all = await clients.matchAll({ type:'window', includeUncontrolled:true });
    for(var i=0;i<all.length;i++){ if('focus' in all[i]){ try{ await all[i].navigate(url); }catch(e){} return all[i].focus(); } }
    if(clients.openWindow) return clients.openWindow(url);
  })());
});
