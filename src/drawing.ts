import { occupied, regionLabel } from "./core/model";

export const positions = [
  [525, 435],
  [135, 170],
  [465, 170],
  [300, 120],
  [300, 435],
  [205, 325],
  [395, 325],
  [300, 250],
] as const;
export const htmlEscape = (text: string): string =>
  text.replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] ?? c,
  );
export function circles(): string {
  return '<circle cx="225" cy="205" r="150" fill="#e9cec3" fill-opacity=".35" stroke="#984330" stroke-width="2"/><circle cx="375" cy="205" r="150" fill="#c6d7d4" fill-opacity=".35" stroke="#315f62" stroke-width="2"/><circle cx="300" cy="335" r="150" fill="#e5d9b4" fill-opacity=".35" stroke="#7b632c" stroke-width="2"/><g font-family="serif" font-size="26" fill="#25302d"><text x="120" y="65">A</text><text x="465" y="65">B</text><text x="300" y="520" text-anchor="middle">C</text></g>';
}
export function diagram(world: number, title = "Membership world"): string {
  const id = title.toLowerCase().replace(/[^a-z0-9]+/g, "-") || "world";
  const description =
    occupied(world)
      .map((r) => `Object ${r + 1}: ${regionLabel(r)}.`)
      .join(" ") || "No objects. This draft has an empty universe.";
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 540" role="img" aria-labelledby="${id}-title ${id}-description"><title id="${id}-title">${htmlEscape(title)}</title><desc id="${id}-description">${htmlEscape(description)} Circles are a modern membership diagram.</desc><rect width="600" height="540" fill="#f1f0e8"/>${circles()}${occupied(
    world,
  )
    .map((r) => {
      const [x, y] = positions[r] ?? [0, 0];
      return `<g><circle cx="${x}" cy="${y}" r="21" fill="#26342f"/><text x="${x}" y="${y + 6}" text-anchor="middle" fill="#fffdf6" font-family="sans-serif" font-size="18">${r + 1}</text></g>`;
    })
    .join("")}</svg>`;
}
