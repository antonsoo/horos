import { type Argument, enumerate, TERMS } from "./model";

export const EXISTENCE_MASKS = [0, 1, 2, 4, 3, 5, 6, 7] as const;

export function requirementLabel(mask: number): string {
  return TERMS.filter((_, t) => (mask & (1 << t)) !== 0).join(" + ") || "None";
}

/** Minimal means inclusion-minimal, not merely fewest classes. */
export function existenceMap(argument: Argument) {
  const results = EXISTENCE_MASKS.map((mask) => ({ mask, ...enumerate(argument, mask) }));
  const sufficient = results.filter((row) => row.verdict === "valid");
  const minimal = sufficient
    .filter(
      (row) =>
        !sufficient.some(
          (other) => other.mask !== row.mask && (other.mask & row.mask) === other.mask,
        ),
    )
    .map((row) => row.mask);
  return {
    minimal,
    rows: results.map((row) => ({
      mask: row.mask,
      verdict: row.verdict,
      permitted: row.admissible.length,
      counterexamples: row.counterexamples.length,
      smallest: row.counterexamples[0] ?? null,
      minimal: minimal.includes(row.mask),
    })),
  };
}
export type ExistenceMap = ReturnType<typeof existenceMap>;
