import assert from "node:assert/strict";
import test from "node:test";
import { counterexampleTrace } from "../src/core/constraints";
import {
  type Argument,
  assess,
  enumerate,
  evaluate,
  KINDS,
  type Proposition,
  type Term,
} from "../src/core/model";
import { argumentFor, lessons } from "../src/lessons";

// Independent counting oracle: turn universals into forbidden regions and
// particulars into nonempty-set obligations. Inclusion-exclusion counts models
// without calling the evaluator or enumerating occupancy worlds.
function regions(subject: Term, predicate: Term, same: boolean): number {
  let mask = 0;
  for (let r = 0; r < 8; r++)
    if (r & (2 ** subject) && Boolean(r & (2 ** predicate)) === same) mask += 2 ** r;
  return mask;
}
function negate(p: Proposition): Proposition {
  const opposite = { all: "some-not", none: "some", some: "none", "some-not": "all" } as const;
  return { ...p, kind: opposite[p.kind] };
}
function countByInclusionExclusion(
  propositions: readonly Proposition[],
  existence: number,
): number {
  let allowed = 255;
  const obligations = [255];
  for (const p of propositions) {
    const region = regions(p.subject, p.predicate, p.kind === "none" || p.kind === "some");
    if (p.kind === "all" || p.kind === "none") allowed &= ~region;
    else obligations.push(region);
  }
  for (const t of [0, 1, 2] as const)
    if (existence & (2 ** t)) obligations.push(regions(t, t, true));
  let count = 0;
  for (let subset = 0; subset < 2 ** obligations.length; subset++) {
    let forbidden = 0;
    let parity = 0;
    for (let i = 0; i < obligations.length; i++)
      if (subset & (2 ** i)) {
        forbidden |= obligations[i] ?? 0;
        parity++;
      }
    const free = (allowed & ~forbidden).toString(2).split("1").length - 1;
    count += (parity % 2 ? -1 : 1) * 2 ** free;
  }
  return count;
}
test("all three source figures and every proposition form match an independent counting oracle", () => {
  const figures = [
    [
      [1, 0],
      [2, 1],
    ],
    [
      [0, 1],
      [2, 1],
    ],
    [
      [1, 0],
      [1, 2],
    ],
  ] as const;
  let cases = 0;
  for (const figure of figures)
    for (const a of KINDS)
      for (const b of KINDS)
        for (const c of KINDS)
          for (let exists = 0; exists < 8; exists++) {
            const argument: Argument = {
              premises: [
                { kind: a, subject: figure[0][0], predicate: figure[0][1] },
                { kind: b, subject: figure[1][0], predicate: figure[1][1] },
              ],
              conclusion: { kind: c, subject: 2, predicate: 0 },
            };
            const result = enumerate(argument, exists);
            const key = JSON.stringify({ argument, exists });
            const trace = counterexampleTrace(argument, exists);
            assert.equal(trace.verdict, result.verdict, key);
            if (trace.base.witness !== null)
              assert.ok(assess(argument, trace.base.witness, exists).admissible, key);
            if (trace.attempt.witness !== null)
              assert.equal(
                assess(argument, trace.attempt.witness, exists).status,
                "counterexample",
                key,
              );
            else assert.ok(trace.attempt.impossible.length, key);
            assert.equal(
              result.admissible.length,
              countByInclusionExclusion(argument.premises, exists),
              key,
            );
            assert.equal(
              result.counterexamples.length,
              countByInclusionExclusion(
                [...argument.premises, negate(argument.conclusion)],
                exists,
              ),
              key,
            );
            assert.equal(
              result.agreeing.length,
              countByInclusionExclusion([...argument.premises, argument.conclusion], exists),
              key,
            );
            cases++;
          }
  assert.equal(cases, 1536);
});
test("Aristotle's horse and stone substitutions preserve premises and reverse the universal conclusion", () => {
  const argument = argumentFor("two-worlds", "all");
  assert.equal(assess(argument, 40, 7).status, "agreement");
  assert.equal(assess(argument, 24, 7).status, "counterexample");
  assert.equal(assess(argumentFor("two-worlds", "none"), 40, 7).status, "counterexample");
  assert.equal(assess(argumentFor("two-worlds", "none"), 24, 7).status, "agreement");
});
test("a false conclusion with a broken premise is not a counterexample", () => {
  const result = assess(argumentFor("chain", "all"), 64, 0);
  assert.equal(result.conclusion.truth, false);
  assert.equal(result.status, "premise");
  assert.equal(result.admissible, false);
});
test("empty subject, empty universe, and required inhabitants remain distinct", () => {
  const a = argumentFor("inhabitant", "some");
  assert.equal(assess(a, 0, 0).status, "empty");
  assert.equal(assess(a, 1, 4).status, "existence");
  assert.equal(assess(a, 1, 0).status, "counterexample");
  assert.equal(enumerate(a, 4).verdict, "valid");
  assert.equal(enumerate(a, 0).verdict, "invalid");
  assert.equal(enumerate(argumentFor("conversion", "some"), 2).verdict, "valid");
  assert.equal(enumerate(argumentFor("conversion", "some"), 0).verdict, "invalid");
});
test("the universal chain survives empty terms; a particular conclusion needs C", () => {
  assert.equal(enumerate(argumentFor("chain", "all"), 0).verdict, "valid");
  assert.equal(enumerate(argumentFor("chain", "some"), 0).verdict, "invalid");
  assert.equal(enumerate(argumentFor("chain", "some"), 4).verdict, "valid");
});
test("contradictory premises are not reported as a satisfiable valid argument", () => {
  const a: Argument = {
    premises: [
      { kind: "all", subject: 0, predicate: 1 },
      { kind: "some-not", subject: 0, predicate: 1 },
    ],
    conclusion: { kind: "some", subject: 1, predicate: 2 },
  };
  assert.equal(enumerate(a, 0).verdict, "inconsistent");
});
test("duplicating representatives never changes any supported proposition", () => {
  for (let world = 0; world < 256; world++) {
    const objects: number[] = [];
    for (let region = 0; region < 8; region++)
      if (world & (2 ** region)) for (let i = 0; i <= region; i++) objects.push(region);
    for (const kind of KINDS)
      for (const s of [0, 1, 2] as const)
        for (const p of [0, 1, 2] as const) {
          const subject = objects.filter((r) => (r & (2 ** s)) !== 0);
          const pred = (r: number) => (r & (2 ** p)) !== 0;
          const truth =
            kind === "all"
              ? subject.every(pred)
              : kind === "none"
                ? subject.every((r) => !pred(r))
                : kind === "some"
                  ? subject.some(pred)
                  : subject.some((r) => !pred(r));
          assert.equal(evaluate({ kind, subject: s, predicate: p }, world).truth, truth);
        }
  }
});
test("all lesson variants match the oracle, including conversion with one premise", () => {
  for (const l of lessons)
    for (const kind of KINDS)
      for (let exists = 0; exists < 8; exists++) {
        const a = argumentFor(l.id, kind);
        assert.equal(
          enumerate(a, exists).counterexamples.length,
          countByInclusionExclusion([...a.premises, negate(a.conclusion)], exists),
        );
      }
});

test("the explanation locates the blocked witness, including inconsistent premises", () => {
  const inhabitant = counterexampleTrace(argumentFor("inhabitant", "some"), 4);
  assert.equal(inhabitant.attempt.witness, null);
  assert.deepEqual(
    inhabitant.attempt.impossible.map((c) => c.label),
    ["C must have an inhabitant"],
  );
  const empty = counterexampleTrace(argumentFor("inhabitant", "some"), 0);
  assert.equal(empty.attempt.witness, 1);
  const chain = counterexampleTrace(argumentFor("chain", "all"), 0);
  assert.equal(chain.attempt.impossible[0]?.label, "To make the conclusion false: Some C is not A");
  const impossible = counterexampleTrace(
    {
      premises: [{ kind: "none", subject: 0, predicate: 0 }],
      conclusion: { kind: "all", subject: 0, predicate: 1 },
    },
    1,
  );
  assert.equal(impossible.verdict, "inconsistent");
  assert.equal(impossible.base.witness, null);
});
