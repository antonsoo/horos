export const TERMS = ["A", "B", "C"] as const;
export type Term = 0 | 1 | 2;
export const KINDS = ["all", "none", "some", "some-not"] as const;
export type Kind = (typeof KINDS)[number];
export interface Proposition {
  kind: Kind;
  subject: Term;
  predicate: Term;
}
export interface Argument {
  premises: readonly Proposition[];
  conclusion: Proposition;
}
export interface Judgment {
  truth: boolean;
  subject: number[];
  relevant: number[];
  explanation: string;
}
export const REGIONS = Array.from({ length: 8 }, (_, index) => index);

export function occupied(world: number): number[] {
  return REGIONS.filter((region) => (world & (1 << region)) !== 0);
}
export function contains(region: number, term: Term): boolean {
  return (region & (1 << term)) !== 0;
}
export function regionLabel(region: number): string {
  const inside = TERMS.filter((_, term) => contains(region, term as Term));
  const outside = TERMS.filter((_, term) => !contains(region, term as Term));
  return `${inside.length ? `In ${inside.join(" and ")}` : "Outside all three"}${inside.length && outside.length ? `; outside ${outside.join(" and ")}` : ""}`;
}
export function statement(p: Proposition): string {
  const s = TERMS[p.subject];
  const a = TERMS[p.predicate];
  if (p.kind === "all") return `Every ${s} is ${a}`;
  if (p.kind === "none") return `No ${s} is ${a}`;
  if (p.kind === "some") return `Some ${s} is ${a}`;
  return `Some ${s} is not ${a}`;
}
export function latin(p: Proposition): string {
  const s = TERMS[p.subject];
  const a = TERMS[p.predicate];
  if (p.kind === "all") return `Omne ${s} est ${a}.`;
  if (p.kind === "none") return `Nullum ${s} est ${a}.`;
  if (p.kind === "some") return `Aliquod ${s} est ${a}.`;
  return `Aliquod ${s} non est ${a}.`;
}
export function evaluate(p: Proposition, world: number): Judgment {
  const subject = occupied(world).filter((r) => contains(r, p.subject));
  const positive = p.kind === "none" || p.kind === "some";
  const relevant = subject.filter((r) => contains(r, p.predicate) === positive);
  const universal = p.kind === "all" || p.kind === "none";
  const truth = universal ? relevant.length === 0 : relevant.length > 0;
  let explanation: string;
  if (!subject.length) {
    explanation = universal
      ? `There are no ${TERMS[p.subject]} objects. This universal is true in the modern model, but supplies no inhabitant.`
      : `There are no ${TERMS[p.subject]} objects, so the required witness does not exist.`;
  } else if (universal) {
    explanation = truth
      ? "No object violates this universal."
      : `Object${relevant.length > 1 ? "s" : ""} ${relevant.map((r) => r + 1).join(", ")} violate${relevant.length === 1 ? "s" : ""} this universal.`;
  } else {
    explanation = truth
      ? `Object${relevant.length > 1 ? "s" : ""} ${relevant.map((r) => r + 1).join(", ")} ${relevant.length > 1 ? "are witnesses" : "is a witness"}. “Some” means at least one, and can include all.`
      : "There is no object with the required combination of memberships.";
  }
  return { truth, subject, relevant, explanation };
}
export function missingExistence(world: number, existence: number): Term[] {
  return ([0, 1, 2] as const).filter(
    (t) => (existence & (1 << t)) !== 0 && !occupied(world).some((r) => contains(r, t)),
  );
}
export function assess(argument: Argument, world: number, existence: number) {
  const premises = argument.premises.map((p) => evaluate(p, world));
  const conclusion = evaluate(argument.conclusion, world);
  const missing = missingExistence(world, existence);
  const admissible = world !== 0 && missing.length === 0 && premises.every((p) => p.truth);
  const status = !world
    ? "empty"
    : missing.length
      ? "existence"
      : !premises.every((p) => p.truth)
        ? "premise"
        : conclusion.truth
          ? "agreement"
          : "counterexample";
  return { premises, conclusion, missing, admissible, status } as const;
}
export function enumerate(argument: Argument, existence: number) {
  const admissible: number[] = [];
  const counterexamples: number[] = [];
  const agreeing: number[] = [];
  for (let world = 1; world < 256; world++) {
    const judgment = assess(argument, world, existence);
    if (!judgment.admissible) continue;
    admissible.push(world);
    (judgment.conclusion.truth ? agreeing : counterexamples).push(world);
  }
  const smallestFirst = (a: number, b: number) => occupied(a).length - occupied(b).length || a - b;
  counterexamples.sort(smallestFirst);
  agreeing.sort(smallestFirst);
  return {
    admissible,
    counterexamples,
    agreeing,
    verdict: !admissible.length ? "inconsistent" : counterexamples.length ? "invalid" : "valid",
  } as const;
}
