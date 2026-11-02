/* Generated from the complete production edition. */
const EDITION = "f69295e424511b7f8a0c";
const CACHE = 'horos-' + EDITION;
const transfer = (function verifiedTransferRuntime() {
  const totalLimit = 180_000;
  const idleLimit = 15_000;
  function error(name        , message        )        {
    const result = new Error(message);
    result.name = name;
    return result;
  }
  function scope(signal              ) {
    const controller = new AbortController();
    const cancel = () => controller.abort(signal?.reason);
    if (signal?.aborted) cancel();
    else signal?.addEventListener("abort", cancel, { once: true });
    const deadline = setTimeout(
      () =>
        controller.abort(
          error("TransferTimeoutError", "The file exceeded the three-minute transfer limit"),
        ),
      totalLimit,
    );
    return {
      controller,
      close() {
        clearTimeout(deadline);
        signal?.removeEventListener("abort", cancel);
      },
    };
  }
  async function read(
    response          ,
    identity                  ,
    controller                 ,
  )                                   {
    controller.signal.throwIfAborted();
    if (!response.ok) {
      void response.body?.cancel().catch(() => {});
      throw error("TransferHttpError", `Could not load the file (HTTP ${response.status})`);
    }
    if (!response.body)
      throw error(
        "TransferIntegrityError",
        "The downloaded file does not match this edition (no body)",
      );
    const reader = response.body.getReader();
    const buffer = new Uint8Array(identity.bytes);
    let length = 0;
    let completed = false;
    let idle                                           ;
    const progress = () => {
      clearTimeout(idle);
      idle = setTimeout(
        () =>
          controller.abort(
            error("TransferTimeoutError", "The file stopped making progress for fifteen seconds"),
          ),
        idleLimit,
      );
    };
    const cancel = () => {
      void reader.cancel(controller.signal.reason).catch(() => {});
    };
    controller.signal.addEventListener("abort", cancel, { once: true });
    try {
      progress();
      for (;;) {
        const { done, value } = await reader.read();
        controller.signal.throwIfAborted();
        if (done) {
          completed = true;
          break;
        }
        if (!value.byteLength) continue;
        progress();
        if (length + value.byteLength > buffer.length)
          throw error(
            "TransferIntegrityError",
            "The downloaded file does not match this edition (too many bytes)",
          );
        buffer.set(value, length);
        length += value.byteLength;
      }
      clearTimeout(idle);
      if (length !== buffer.length)
        throw error(
          "TransferIntegrityError",
          "The downloaded file does not match this edition (wrong length)",
        );
      const hash = Array.from(
        new Uint8Array(await crypto.subtle.digest("SHA-256", buffer)),
        (byte) => byte.toString(16).padStart(2, "0"),
      ).join("");
      controller.signal.throwIfAborted();
      if (hash !== identity.sha256)
        throw error(
          "TransferIntegrityError",
          "The downloaded file failed its source check. No substituted file will be used",
        );
      return buffer;
    } finally {
      clearTimeout(idle);
      controller.signal.removeEventListener("abort", cancel);
      if (!completed) void reader.cancel().catch(() => {});
      reader.releaseLock();
    }
  }
  async function readBytes(response          , identity                  , signal              ) {
    const request = scope(signal);
    try {
      return await read(response, identity, request.controller);
    } catch (caught) {
      if (request.controller.signal.aborted) throw request.controller.signal.reason;
      throw caught;
    } finally {
      request.close();
    }
  }
  async function fetchBytes(
    url        ,
    identity                  ,
    signal              ,
    headerLimit = 60_000,
    cache               = "no-store",
  ) {
    const request = scope(signal);
    const { controller } = request;
    const headers = setTimeout(
      () =>
        controller.abort(
          error("TransferTimeoutError", "The server did not begin sending the file in time"),
        ),
      headerLimit,
    );
    try {
      controller.signal.throwIfAborted();
      let response          ;
      try {
        response = await fetch(url, {
          signal: controller.signal,
          cache,
          headers: { "X-Horos-Transfer": "verified" },
        });
      } catch (caught) {
        controller.signal.throwIfAborted();
        throw error(
          "TransferNetworkError",
          `Could not load the file: ${caught instanceof Error ? caught.message : "the source could not be reached"}`,
        );
      }
      clearTimeout(headers);
      return { bytes: await read(response, identity, controller), response };
    } catch (caught) {
      if (controller.signal.aborted) throw controller.signal.reason;
      throw caught;
    } finally {
      clearTimeout(headers);
      request.close();
    }
  }
  return { fetchBytes, readBytes };
})();
const FILES = [{"url":"/horos/assets/conditionals-CTsE3aXz.js","hash":"f4ef8b4522d3e9ec963c19d5501785a8e316e7d5c6c32dc14134be04db32d9cb","bytes":43173},{"url":"/horos/assets/conditionals-DFlinm-K.css","hash":"40efdb85a09c107112657a07d0754f55c58b7f22865b85fbbc3de83ac6e4cc83","bytes":9718},{"url":"/horos/assets/index-D0iTZpS4.css","hash":"bdf8abb3ea0404f8e17eaa1eb36811b8ecfd705a4ac4f19787f3e31eb734c83f","bytes":12519},{"url":"/horos/assets/index-DMXMU-To.js","hash":"e3dcf11f79f2a8b9f57779295d272541f923d78babb5c4a1b29ce77dca0d4a73","bytes":50623},{"url":"/horos/assets/offline-lP_CRzm6.js","hash":"3856458e2e0a3fa8c57d996e85e02801d352fd68d4e0903275c525778772adb8","bytes":15575},{"url":"/horos/conditionals.html","hash":"b71e5a30ef9dbf866356af846cf4a27e6498f17e71a37aaec074fd3ffe46e129","bytes":13528},{"url":"/horos/favicon.svg","hash":"b743fbd2d73b8cae622aa658af6176359bb4a5fdaf318784f75f189c68842add","bytes":399},{"url":"/horos/fonts/literata-OFL.txt","hash":"8742963604cd89dc81437811a850018fc03b2bfad686d7422c8235967c87614e","bytes":4389},{"url":"/horos/fonts/literata.woff2","hash":"99efd2b91637e922059a38d459abeceade161dc868b47318fa3b9c99137293db","bytes":396664},{"url":"/horos/fonts/provenance.json","hash":"a33529cd8d64a41671cbfa367a56f0180d399810f3434f8c00b6e0e07e3115a2","bytes":637},{"url":"/horos/fonts/sourcesans3-OFL.txt","hash":"09746787287a289323b0ec3cff4d1a4a801331b82b7207c1e186f5d26619a392","bytes":4579},{"url":"/horos/fonts/sourcesans3.woff2","hash":"5f16566f7a40d39b339ad26be151fa5a1ab1f0c2574c7a2e619765584a1acbd8","bytes":170188},{"url":"/horos/index.html","hash":"b01f43a068292203759739984dfb914204693ef68a9b9e4b805dddcfbb7a54d8","bytes":14854},{"url":"/horos/LICENSE.txt","hash":"dccef1f6195096362d411c57b722275e5b4ffd5df84cb719c1fe962c9770d6d0","bytes":4651},{"url":"/horos/sources/bekker-p24.jpg","hash":"acb61feb74c9a7e5c532708ee1826fc6054d82e294aeef539a4a315fbe6f109a","bytes":863245},{"url":"/horos/sources/bekker-p25.jpg","hash":"7ee0106dc32eb37e32477d9e62f433b2ca14a64118a9fe3bfe1fffbf91f25d2d","bytes":974737},{"url":"/horos/sources/bekker-p26.jpg","hash":"13ce538bb4c850041e77f3672fe7228587a90cfbc1497c49190bd28f9e4d6048","bytes":935958},{"url":"/horos/sources/bekker-p28.jpg","hash":"a93760f9e0f3bc05114cc6e50e2e6dbd6b04d325baba2241cf0f2bd6801f4c9b","bytes":999080},{"url":"/horos/sources/conditionals/manifest.json","hash":"dabd83b23eeab4aedd0323c31e856a9babb5f934fc7b20ca8711cfb847fca00c","bytes":2024},{"url":"/horos/sources/conditionals/mutschmann-p92.jpg","hash":"c9ac0eac6934f6b537f25d35e320f1e67d0db3e6e9e9fb77e1e14c607e7ddfed","bytes":695470},{"url":"/horos/sources/conditionals/mutschmann-p93.jpg","hash":"e48fc4b73dea853b8009454ae1a20cc19ffc9d4dd8728b9f9f14dc9e9cc5bbd1","bytes":749017},{"url":"/horos/sources/conditionals/NOTICE.txt","hash":"4a932f5dfbd0e9fbbc2dd41c3f39f1b172c29328e04b323200f96fc68746c3ff","bytes":2508},{"url":"/horos/sources/manifest.json","hash":"52f1e9bb706e5198e6bddbeae6b14fe8a7b94961736d94738870eb864b016c0f","bytes":2665},{"url":"/horos/sources/NOTICE.txt","hash":"37c2495b93e22fe3e065e38b5e4a1351f3c19c15da83901d44cf6d6c0738d83c","bytes":1747}];
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
const pendingTransfers = new Map();
async function fetchEdition(file) {
  let pending = pendingTransfers.get(file.url);
  if (!pending) {
    pending = (async () => {
      const {bytes, response} = await transfer.fetchBytes(file.url, {bytes:file.bytes, sha256:file.hash}, undefined, 60000, 'reload');
      const headers = new Headers(response.headers);
      headers.delete('Content-Encoding');
      headers.set('Content-Length', String(bytes.byteLength));
      return new Response(bytes, {status:response.status, statusText:response.statusText, headers});
    })();
    pendingTransfers.set(file.url, pending);
    pending.then(() => pendingTransfers.delete(file.url), () => pendingTransfers.delete(file.url));
  }
  // Every reader owns a body; a simultaneous inventory repair shares the fetch.
  return (await pending).clone();
}
async function pruneOldCaches() {
  for (const name of await caches.keys()) if (name.startsWith('horos-') && name !== CACHE) await caches.delete(name);
}
self.addEventListener('install', event => event.waitUntil((async () => {
  const cache = await caches.open(CACHE);
  // Reuse old files only after verification against this edition's identities.
  const older = (await caches.keys()).filter(name => name.startsWith('horos-') && name !== CACHE);
  for (const file of FILES) {
    if (await matches(await cache.match(file.url), file)) continue;
    for (const name of older) {
      const saved = await caches.match(file.url, {cacheName:name});
      if (saved && await matches(saved.clone(), file)) { await cache.put(file.url, saved); break; }
    }
  }
  // Firefox bounds installation independently of an individual fetch timeout.
  // Keep the workshop operable first. Pages retain large sources and fonts next.
  for (const file of FILES.filter(file => !/\.(?:jpg|woff2)$/.test(file.url))) {
    if (await matches(await cache.match(file.url), file)) continue;
    await cache.put(file.url, await fetchEdition(file));
  }
  // Verified partial files survive an interrupted install and can resume later.
})()));
self.addEventListener('activate', event => event.waitUntil((async () => {
  if (await storedInventoryComplete()) await pruneOldCaches();
  await self.clients.claim();
})()));
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  // Page-owned verified reads must stream outside a worker's event lifetime.
  if (event.request.headers.get('X-Horos-Transfer') === 'verified') return;
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
  if (event.data?.type === 'retained' && event.data.edition === EDITION) {
    event.waitUntil((async () => {
      if (await storedInventoryComplete()) { await pruneOldCaches(); await restoreClients(); }
    })());
    return;
  }
  if (event.data?.type !== 'inventory' || !event.ports[0]) return;
  event.waitUntil((async () => {
    const missing = [];
    for (const [index, file] of FILES.entries()) {
      event.ports[0].postMessage({edition:EDITION,progress:true,checked:index,files:FILES.length});
      if (!await matches(await caches.match(file.url, {cacheName:CACHE}), file)) missing.push(file);
    }
    if (missing.length) await invalidateClients();
    else { await pruneOldCaches(); await restoreClients(); }
    event.ports[0].postMessage({edition:EDITION,complete:missing.length === 0,files:FILES.length,missing});
  })().catch(async () => {
    await invalidateClients();
    event.ports[0].postMessage({edition:EDITION,complete:false});
  }));
});
