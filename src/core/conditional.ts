/** A case is a simultaneous assignment: bit 1 = p, bit 0 = q. */
export const CASES = [3, 2, 1, 0] as const;
export type Case = (typeof CASES)[number];
export type Sentence = "speech" | "identity";
export interface ConditionalSnapshot {
  sentence: Sentence;
  now: Case;
  /** Four-bit set of considered cases; even an empty draft is preserved. */
  allowed: number;
}
export interface ConditionalNotebook {
  format: "horos-conditionals";
  version: 1;
  current: ConditionalSnapshot;
  pinned: ConditionalSnapshot | null;
  note: string;
}

export function values(c: Case): { p: boolean; q: boolean } {
  return { p: (c & 2) !== 0, q: (c & 1) !== 0 };
}
export function inherentCases(sentence: Sentence): number {
  return sentence === "identity" ? 9 : 15;
}
export function considered(s: ConditionalSnapshot): Case[] {
  return CASES.filter((c) => (s.allowed & (1 << c)) !== 0);
}
export function caseLabel(c: Case, sentence: Sentence): string {
  const { p, q } = values(c);
  if (sentence === "identity")
    return p === q
      ? p
        ? "Day in both clauses"
        : "Night in both clauses"
      : "Contradictory day clauses";
  return `${p ? "Day" : "Night"}, ${q ? "talking" : "silent"}`;
}
export function sentenceText(sentence: Sentence): string {
  return sentence === "identity" ? "If it is day, it is day." : "If it is day, I am talking.";
}
export function initialConditional(sentence: Sentence = "speech"): ConditionalSnapshot {
  return { sentence, now: 3, allowed: inherentCases(sentence) };
}
export function blankConditional(): ConditionalNotebook {
  return {
    format: "horos-conditionals",
    version: 1,
    current: initialConditional(),
    pinned: null,
    note: "",
  };
}

export function judgeConditional(s: ConditionalSnapshot): {
  philo: boolean;
  compatibility: "fails" | "passes" | "empty";
  currentAllowed: boolean;
  antecedentPossible: boolean;
  counterexample: Case | null;
} {
  const { p, q } = values(s.now);
  const cases = considered(s);
  // The forbidden pair is derived from the values, rather than a truth table
  // tied to presentation order. This is the whole finite analogue's criterion.
  const counterexample = cases.find((c) => values(c).p && !values(c).q) ?? null;
  return {
    philo: !p || q,
    compatibility: cases.length === 0 ? "empty" : counterexample === null ? "passes" : "fails",
    currentAllowed: cases.includes(s.now),
    antecedentPossible: cases.some((c) => values(c).p),
    counterexample,
  };
}

function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new Error("Expected a conditional notebook object.");
  return value as Record<string, unknown>;
}
function snapshot(value: unknown): ConditionalSnapshot {
  const v = object(value);
  if (v.sentence !== "speech" && v.sentence !== "identity")
    throw new Error("This notebook names an unknown sentence.");
  if (typeof v.now !== "number" || !CASES.includes(v.now as Case))
    throw new Error("The current case must be one of the four truth assignments.");
  if (
    typeof v.allowed !== "number" ||
    !Number.isInteger(v.allowed) ||
    v.allowed < 0 ||
    v.allowed > 15
  )
    throw new Error("The considered-case table must be a four-bit set.");
  const inherent = inherentCases(v.sentence);
  if ((inherent & (1 << v.now)) === 0 || (v.allowed & ~inherent) !== 0)
    throw new Error(
      "The repeated day sentence cannot have different truth values in its two clauses.",
    );
  return { sentence: v.sentence, now: v.now as Case, allowed: v.allowed };
}
export function parseConditional(text: string): ConditionalNotebook {
  if (text.length > 24_000)
    throw new Error("The conditional notebook is too large (24 KB text limit).");
  let value: unknown;
  try {
    value = JSON.parse(text);
  } catch {
    throw new Error("This is not valid conditional notebook JSON.");
  }
  const v = object(value);
  if (v.format !== "horos-conditionals" || v.version !== 1)
    throw new Error(
      "Open a version 1 Horos conditional notebook. Class notebooks open in the other room.",
    );
  if (typeof v.note !== "string" || v.note.length > 4000)
    throw new Error("The explanation must contain at most 4,000 characters.");
  return {
    format: "horos-conditionals",
    version: 1,
    current: snapshot(v.current),
    pinned: v.pinned === null ? null : snapshot(v.pinned),
    note: v.note,
  };
}
export function conditionalLink(record: ConditionalNotebook): string {
  return `#conditional=${encodeURIComponent(JSON.stringify(record))}`;
}
export function readConditionalLink(hash: string): ConditionalNotebook {
  if (!hash.startsWith("#conditional=") || hash.length > 120_000)
    throw new Error("This is not a supported conditional notebook link.");
  try {
    return parseConditional(decodeURIComponent(hash.slice(13)));
  } catch (error) {
    if (error instanceof URIError) throw new Error("The notebook link has damaged text encoding.");
    throw error;
  }
}
