import assert from "node:assert/strict";
import test from "node:test";
import { existenceMap } from "../src/core/existence";
import type { Argument } from "../src/core/model";
import { argumentFor } from "../src/lessons";

test("conversion isolates B; the taking of an instance isolates C", () => {
  assert.deepEqual(existenceMap(argumentFor("conversion", "some")).minimal, [2]);
  assert.deepEqual(existenceMap(argumentFor("inhabitant", "some")).minimal, [4]);
  assert.deepEqual(existenceMap(argumentFor("chain", "all")).minimal, [0]);
  assert.deepEqual(existenceMap(argumentFor("chain", "some")).minimal, [4]);
  assert.deepEqual(existenceMap(argumentFor("two-worlds", "all")).minimal, []);
});

test("incomparable sufficient requirements are retained as separate alternatives", () => {
  const argument: Argument = {
    premises: argumentFor("chain", "all").premises,
    conclusion: { kind: "some", subject: 1, predicate: 0 },
  };
  assert.deepEqual(existenceMap(argument).minimal, [2, 4]);
});

test("an inconsistent inhabitant requirement is never a sufficient repair", () => {
  const argument: Argument = {
    premises: [{ kind: "none", subject: 2, predicate: 2 }],
    conclusion: { kind: "some", subject: 2, predicate: 0 },
  };
  const map = existenceMap(argument);
  assert.deepEqual(map.minimal, []);
  for (const row of map.rows) {
    assert.equal(row.verdict, row.mask & 4 ? "inconsistent" : "invalid");
    assert.equal(row.smallest === null, Boolean(row.mask & 4));
    assert.equal(row.minimal, false);
  }
});
