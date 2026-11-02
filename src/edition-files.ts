import { verifiedTransferRuntime } from "./verified-transfer";

export interface EditionFile {
  url: string;
  bytes: number;
  sha256: string;
}
const transfer = verifiedTransferRuntime();
export function currentEdition(): string | undefined {
  const edition = document.querySelector<HTMLMetaElement>('meta[name="horos-edition"]')?.content;
  return edition && /^[a-f0-9]{20}$/.test(edition) ? edition : undefined;
}

/** A page owns long transfers; worker event lifetimes need not cover them. */
export async function editionFileBytes(
  file: EditionFile,
  signal?: AbortSignal,
  mustRetain = false,
): Promise<Uint8Array<ArrayBuffer>> {
  const edition = currentEdition();
  const url = new URL(file.url, location.href).href;
  async function read(): Promise<Uint8Array<ArrayBuffer>> {
    signal?.throwIfAborted();
    let cache: Cache | undefined;
    if (edition && "caches" in window) {
      try {
        // A blocked/unsupported worker must not silently install a second
        // retention system. An installing or waiting registration is sufficient.
        const registration = await navigator.serviceWorker?.getRegistration(
          import.meta.env.BASE_URL,
        );
        if (registration) cache = await caches.open(`horos-${edition}`);
      } catch {
        /* Connected reading remains useful if storage is unavailable. */
      }
    }
    if (cache) {
      const saved = await cache.match(url);
      if (saved) {
        try {
          return await transfer.readBytes(saved, file, signal);
        } catch (error) {
          signal?.throwIfAborted();
          // The inventory already diagnosed a repair job's missing file.
          // Re-announcing its own failure would recursively start fresh repairs.
          if (!mustRetain) window.dispatchEvent(new Event("horos:asset-failure"));
          // An offline corrupt copy cannot be replaced by an unrelated edition.
          if (!navigator.onLine) throw error;
        }
      }
    }
    const { bytes, response } = await transfer.fetchBytes(url, file, signal);
    signal?.throwIfAborted();
    if (cache) {
      try {
        const headers = new Headers(response.headers);
        headers.delete("Content-Encoding");
        headers.set("Content-Length", String(bytes.byteLength));
        await cache.put(url, new Response(bytes, { status: response.status, headers }));
        window.dispatchEvent(new Event("horos:asset-retained"));
        navigator.serviceWorker?.controller?.postMessage({ type: "retained", edition });
      } catch (error) {
        if (mustRetain) throw error;
      }
    } else if (mustRetain) throw new Error("This browser could not retain the offline files");
    signal?.throwIfAborted();
    return bytes;
  }
  if (edition && navigator.locks) {
    // Foreground reading, export and both rooms share one verified cache write.
    // Canceling a waiter does not abort another page's independent transfer.
    return navigator.locks.request(`horos-${edition}:${url}`, signal ? { signal } : {}, read);
  }
  return read();
}
