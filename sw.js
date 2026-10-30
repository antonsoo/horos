/* Generated from the complete production edition. */
const EDITION = "b650d6cb3018691f56a8";
const CACHE = 'horos-' + EDITION;
const FILES = [{"url":"/horos/assets/index-B58XCBBK.css","hash":"f7bd242f372eb8a004adc8f39652d578c939e510b617a4ca9ea0c4f4ede0ccdf","bytes":11047},{"url":"/horos/assets/index-DYmYizm1.js","hash":"51d88a257865f514923882821035e6c99fb64fb706e4d5d1cfed9273bae30617","bytes":55292},{"url":"/horos/favicon.svg","hash":"b743fbd2d73b8cae622aa658af6176359bb4a5fdaf318784f75f189c68842add","bytes":399},{"url":"/horos/fonts/literata-OFL.txt","hash":"8742963604cd89dc81437811a850018fc03b2bfad686d7422c8235967c87614e","bytes":4389},{"url":"/horos/fonts/literata.woff2","hash":"99efd2b91637e922059a38d459abeceade161dc868b47318fa3b9c99137293db","bytes":396664},{"url":"/horos/fonts/provenance.json","hash":"a33529cd8d64a41671cbfa367a56f0180d399810f3434f8c00b6e0e07e3115a2","bytes":637},{"url":"/horos/fonts/sourcesans3-OFL.txt","hash":"09746787287a289323b0ec3cff4d1a4a801331b82b7207c1e186f5d26619a392","bytes":4579},{"url":"/horos/fonts/sourcesans3.woff2","hash":"5f16566f7a40d39b339ad26be151fa5a1ab1f0c2574c7a2e619765584a1acbd8","bytes":170188},{"url":"/horos/index.html","hash":"a79db142e9b3ecad9bb95f43b1c11339ad9341685042dea4f4353f9902059ca2","bytes":12713},{"url":"/horos/LICENSE.txt","hash":"62145e70388e9be739b404f904df6434bacaa748c9b5875c146791457fb83b81","bytes":1071},{"url":"/horos/sources/bekker-p24.jpg","hash":"acb61feb74c9a7e5c532708ee1826fc6054d82e294aeef539a4a315fbe6f109a","bytes":863245},{"url":"/horos/sources/bekker-p25.jpg","hash":"7ee0106dc32eb37e32477d9e62f433b2ca14a64118a9fe3bfe1fffbf91f25d2d","bytes":974737},{"url":"/horos/sources/bekker-p26.jpg","hash":"13ce538bb4c850041e77f3672fe7228587a90cfbc1497c49190bd28f9e4d6048","bytes":935958},{"url":"/horos/sources/bekker-p28.jpg","hash":"a93760f9e0f3bc05114cc6e50e2e6dbd6b04d325baba2241cf0f2bd6801f4c9b","bytes":999080},{"url":"/horos/sources/manifest.json","hash":"25292b65c94822417f51e729eefb8e13a61d5de9b6ab4edf377d3a748cd0c3a9","bytes":2665},{"url":"/horos/sources/NOTICE.txt","hash":"e39cd4c53d4e35677c53566582541916572b2b799983f0bf8259712cfc2a768a","bytes":1728}];
const allowed = new Map(FILES.map(file => [new URL(file.url, self.location.origin).href, file]));
const digest = async bytes => Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', bytes)), b => b.toString(16).padStart(2, '0')).join('');
let invalidationSent = false;
async function notifyClients(type) {
  const pages = await self.clients.matchAll({type:'window'});
  for (const page of pages) page.postMessage({type,edition:EDITION});
}
async function invalidateClients() {
  if (invalidationSent) return;
  invalidationSent = true;
  await notifyClients('inventory-invalidated');
}
async function restoreClients() {
  if (!invalidationSent) return;
  invalidationSent = false;
  await notifyClients('inventory-restored');
}
async function storedInventoryComplete() {
  for (const file of FILES) {
    if (!await matches(await caches.match(file.url, {cacheName:CACHE}), file)) return false;
  }
  return true;
}
async function matches(response, file) {
  if (!response || !response.ok) return false;
  const bytes = await response.arrayBuffer();
  return bytes.byteLength === file.bytes && await digest(bytes) === file.hash;
}
async function fetchEdition(file) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20000);
  try {
    const response = await fetch(file.url, {cache:'reload', signal:controller.signal});
    if (!await matches(response.clone(), file)) throw new Error('Edition mismatch: ' + file.url);
    return response;
  } finally {clearTimeout(timeout);}
}
self.addEventListener('install', event => event.waitUntil((async () => {
  const cache = await caches.open(CACHE);
  try {
    for (const file of FILES) {
      const response = await fetchEdition(file);
      await cache.put(file.url, response);
    }
  } catch (error) { await caches.delete(CACHE); throw error; }
})()));
self.addEventListener('activate', event => event.waitUntil((async () => {
  for (const name of await caches.keys()) if (name.startsWith('horos-') && name !== CACHE) await caches.delete(name);
  await self.clients.claim();
})()));
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname === '/horos/') url.pathname += 'index.html';
  url.search = ''; url.hash = '';
  const file = allowed.get(url.href);
  if (!file) return;
  event.respondWith((async () => {
    const saved = await caches.match(url.href, {cacheName:CACHE});
    if (saved && await matches(saved.clone(), file)) return saved;
    await invalidateClients();
    try {
      const response = await fetchEdition(file);
      try {
        await (await caches.open(CACHE)).put(file.url, response.clone());
        if (invalidationSent && await storedInventoryComplete()) await restoreClients();
      }
      catch {} // A connected read can succeed without claiming offline retention.
      return response;
    } catch {
      return new Response('This file is unavailable for the current Horos edition. Reconnect and reopen the workshop.', {status:503, headers:{'Content-Type':'text/plain;charset=utf-8'}});
    }
  })());
});
self.addEventListener('message', event => {
  if (event.data?.type !== 'inventory' || !event.ports[0]) return;
  event.waitUntil((async () => {
    let complete = true;
    for (const file of FILES) {
      if (!await matches(await caches.match(file.url, {cacheName:CACHE}), file)) {
        await invalidateClients();
        if (event.data.repair !== true) {complete = false; break;}
        const response = await fetchEdition(file);
        await (await caches.open(CACHE)).put(file.url, response);
      }
    }
    if (complete) await restoreClients();
    event.ports[0].postMessage({edition:EDITION, complete, files:FILES.length});
  })().catch(async () => {
    await invalidateClients();
    event.ports[0].postMessage({edition:EDITION,complete:false});
  }));
});
