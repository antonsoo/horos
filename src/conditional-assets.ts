import manifest from "./conditional-assets.json";

export const conditionalAssets = manifest;
export function conditionalAsset(path: string): (typeof manifest)[number] {
  const item = manifest.find((a) => a.path === path);
  if (!item) throw new Error(`Unknown conditional source: ${path}`);
  return item;
}
