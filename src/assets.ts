import manifest from "./asset-manifest.json";
import { editionFileBytes } from "./edition-files";

export const assets = manifest;
export type Asset = (typeof assets)[number];

export function asset(path: string): Asset {
  const found = assets.find((item) => item.path === path);
  if (!found) throw new Error(`Unknown retained file: ${path}`);
  return found;
}

export async function verifiedBytes(item: Asset, signal?: AbortSignal): Promise<ArrayBuffer> {
  try {
    return await readVerifiedBytes(item, signal);
  } catch (error) {
    // Some browser reads bypass the worker. Discovered failures must also
    // invalidate the page's previous offline-readiness claim.
    if (!signal?.aborted) window.dispatchEvent(new Event("horos:asset-failure"));
    throw error;
  }
}

async function readVerifiedBytes(item: Asset, signal?: AbortSignal): Promise<ArrayBuffer> {
  try {
    return (
      await editionFileBytes(
        { url: `${import.meta.env.BASE_URL}${item.path}`, bytes: item.bytes, sha256: item.sha256 },
        signal,
      )
    ).buffer;
  } catch (error) {
    signal?.throwIfAborted();
    throw new Error(
      `Could not read ${item.path}: ${error instanceof Error ? error.message : "The file could not be read"}. Check the connection and try again; your case has been kept.`,
    );
  }
}

export async function dataUrl(item: Asset, signal?: AbortSignal): Promise<string> {
  const bytes = new Uint8Array(await verifiedBytes(item, signal));
  let binary = "";
  for (let i = 0; i < bytes.length; i += 16_384)
    binary += String.fromCharCode(...bytes.subarray(i, i + 16_384));
  return `data:${item.mime};base64,${btoa(binary)}`;
}
