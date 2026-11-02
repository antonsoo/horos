import { createHash } from "node:crypto";
import { readdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { verifiedTransferRuntime } from "../src/verified-transfer.ts";

const base = "/horos/";
async function walk(path) {
  const list = [];
  for (const entry of (await readdir(path, { withFileTypes: true })).sort((a, b) =>
    a.name.localeCompare(b.name),
  )) {
    if (entry.isDirectory()) list.push(...(await walk(join(path, entry.name))));
    else list.push(join(path, entry.name));
  }
  return list;
}
const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
const paths = (await walk("dist")).filter((path) => !path.endsWith("/sw.js"));
const seed = [];
for (const path of paths) seed.push(`${path}:${hash(await readFile(path))}`);
seed.push(`worker-builder:${hash(await readFile(new URL(import.meta.url)))}`);
seed.push(
  `transfer-runtime:${hash(await readFile(new URL("../src/verified-transfer.ts", import.meta.url)))}`,
);
const edition = hash(seed.join("\n")).slice(0, 20);
for (const path of paths.filter((path) => path.endsWith(".html"))) {
  const html = await readFile(path, "utf8");
  await writeFile(
    path,
    html.replace("</head>", `<meta name="horos-edition" content="${edition}"></head>`),
  );
}
const files = [];
for (const path of paths) {
  const bytes = await readFile(path);
  files.push({ url: base + path.slice(5), hash: hash(bytes), bytes: bytes.length });
}
await writeFile(
  "dist/sw.js",
  `/* Generated from the complete production edition. */
const EDITION = ${JSON.stringify(edition)};
const CACHE = 'horos-' + EDITION;
const transfer = (${verifiedTransferRuntime.toString()})();
const FILES = ${JSON.stringify(files)};
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
  for (const file of FILES.filter(file => !/\\.(?:jpg|woff2)$/.test(file.url))) {
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
  if (url.pathname === '${base}') url.pathname += 'index.html';
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
`,
);
console.log(
  `Offline edition ${edition}: ${files.length} files, ${files.reduce((sum, file) => sum + file.bytes, 0)} bytes.`,
);
