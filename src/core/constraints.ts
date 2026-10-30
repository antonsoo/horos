import {
  type Argument,
  contains,
  type Proposition,
  REGIONS,
  statement,
  TERMS,
  type Term,
} from "./model";

export interface Constraint {
  label: string;
  regions: number[];
}
export interface Constraints {
  exclusions: Constraint[];
  obligations: Constraint[];
  allowed: number[];
  impossible: Constraint[];
  witness: number | null;
}

export function negate(p: Proposition): Proposition {
  const kinds = { all: "some-not", none: "some", some: "none", "some-not": "all" } as const;
  return { ...p, kind: kinds[p.kind] };
}

/** Build a world directly from region constraints; no search over worlds. */
function solve(
  propositions: { proposition: Proposition; label: string }[],
  existence: number,
): Constraints {
  const exclusions: Constraint[] = [];
  const obligations: Constraint[] = [
    { label: "The world must contain an object", regions: [...REGIONS] },
  ];
  for (const { proposition: p, label } of propositions) {
    const regions = REGIONS.filter(
      (r) =>
        contains(r, p.subject) &&
        contains(r, p.predicate) === (p.kind === "none" || p.kind === "some"),
    );
    const constraint = { label, regions };
    (p.kind === "all" || p.kind === "none" ? exclusions : obligations).push(constraint);
  }
  for (const t of [0, 1, 2] as const) {
    if (existence & (1 << t))
      obligations.push({
        label: `${TERMS[t]} must have an inhabitant`,
        regions: REGIONS.filter((r) => contains(r, t as Term)),
      });
  }
  const allowed = REGIONS.filter((r) => !exclusions.some((c) => c.regions.includes(r)));
  const remaining = obligations.map((c) => ({
    ...c,
    regions: c.regions.filter((r) => allowed.includes(r)),
  }));
  const impossible = remaining.filter((c) => !c.regions.length);
  // There are no upper bounds or identity conditions: witnesses can coexist.
  const witness = impossible.length
    ? null
    : remaining.reduce((world, c) => world | (1 << (c.regions[0] ?? 0)), 0);
  return { exclusions, obligations: remaining, allowed, impossible, witness };
}

export function counterexampleTrace(argument: Argument, existence: number) {
  const premises = argument.premises.map((p, i) => ({
    proposition: p,
    label: `Premise ${i + 1}: ${statement(p)}`,
  }));
  const base = solve(premises, existence);
  const denial = negate(argument.conclusion);
  const attempt = solve(
    [
      ...premises,
      { proposition: denial, label: `To make the conclusion false: ${statement(denial)}` },
    ],
    existence,
  );
  return {
    base,
    attempt,
    denial,
    verdict:
      base.witness === null ? "inconsistent" : attempt.witness === null ? "valid" : "invalid",
  } as const;
}
