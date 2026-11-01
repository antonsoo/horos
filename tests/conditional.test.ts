import assert from "node:assert/strict";
import test from "node:test";
import {
  blankConditional,
  CASES,
  type ConditionalSnapshot,
  conditionalLink,
  inherentCases,
  initialConditional,
  judgeConditional,
  parseConditional,
  readConditionalLink,
  type Sentence,
} from "../src/core/conditional";
import { evaluate } from "../src/core/model";

// An independent existing engine evaluates universals over objects with class
// memberships. Translate each admitted truth case into an object in two classes:
// p is A, q is B. "Every A is B" then has exactly the compatibility criterion.
function membershipWorld(cases: number[]): number {
  let world = 0;
  for (const c of cases) {
    const membership = (c >= 2 ? 1 : 0) + (c % 2 === 1 ? 2 : 0);
    world += 2 ** membership;
  }
  return world;
}
test("all 72 legal finite drafts agree with the independent class-membership engine", () => {
  let count = 0;
  for (const sentence of ["speech", "identity"] as Sentence[])
    for (let mask = 0; mask < 16; mask++)
      for (const now of CASES) {
        if (mask & ~inherentCases(sentence) || !(inherentCases(sentence) & (1 << now))) continue;
        const s: ConditionalSnapshot = { sentence, now, allowed: mask };
        const j = judgeConditional(s);
        const admitted = CASES.filter((c) => mask & (1 << c));
        const universal = { kind: "all", subject: 0, predicate: 1 } as const;
        assert.equal(j.philo, evaluate(universal, membershipWorld([now])).truth);
        assert.equal(j.currentAllowed, admitted.includes(now));
        if (!admitted.length) assert.equal(j.compatibility, "empty");
        else {
          assert.equal(
            j.compatibility === "passes",
            evaluate(universal, membershipWorld(admitted)).truth,
          );
          if (j.counterexample !== null) {
            assert.ok(admitted.includes(j.counterexample));
            assert.equal(evaluate(universal, membershipWorld([j.counterexample])).truth, false);
          }
        }
        count++;
      }
  assert.equal(count, 72);
});
test("the source's talking example, silence and repeated sentence keep their distinct results", () => {
  const speech = initialConditional();
  assert.deepEqual(
    [judgeConditional(speech).philo, judgeConditional(speech).compatibility],
    [true, "fails"],
  );
  speech.now = 2;
  assert.equal(judgeConditional(speech).philo, false);
  speech.now = 0;
  assert.equal(judgeConditional(speech).philo, true);
  assert.equal(judgeConditional(speech).compatibility, "fails");
  assert.equal(judgeConditional(initialConditional("identity")).compatibility, "passes");
});
test("a vacuous pass, empty table and excluded current facts are exposed separately", () => {
  assert.equal(
    judgeConditional({ sentence: "speech", now: 0, allowed: 3 }).antecedentPossible,
    false,
  );
  assert.equal(
    judgeConditional({ sentence: "speech", now: 0, allowed: 3 }).compatibility,
    "passes",
  );
  assert.equal(judgeConditional({ sentence: "speech", now: 3, allowed: 0 }).compatibility, "empty");
  const j = judgeConditional({ sentence: "speech", now: 2, allowed: 11 });
  assert.equal(j.currentAllowed, false);
  assert.equal(j.compatibility, "passes");
  assert.equal(j.philo, false);
});
test("editable records and explicit links preserve drafts and prose but recompute supplied outcomes", () => {
  const record = blankConditional();
  record.current.allowed = 0;
  record.note = "ἡμέρα <script> & a comparison\nsecond line";
  record.pinned = initialConditional("identity");
  assert.deepEqual(readConditionalLink(conditionalLink(record)), record);
  assert.deepEqual(parseConditional(JSON.stringify({ ...record, verdict: "true" })), record);
  const bad = (change: object) => JSON.stringify({ ...record, ...change });
  for (const current of [
    { sentence: "speech", now: 4, allowed: 15 },
    { sentence: "speech", now: 3, allowed: 16 },
    { sentence: "identity", now: 2, allowed: 9 },
    { sentence: "identity", now: 3, allowed: 15 },
    { sentence: "unknown", now: 3, allowed: 9 },
  ])
    assert.throws(() => parseConditional(bad({ current })));
  assert.throws(() => parseConditional(bad({ pinned: undefined })));
  assert.throws(() => parseConditional(bad({ note: "x".repeat(4001) })));
  assert.throws(() => readConditionalLink("#conditional=%zz"));
});
