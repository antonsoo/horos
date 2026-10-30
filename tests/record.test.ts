import assert from "node:assert/strict";
import test from "node:test";
import { blank, decode, encode, parse } from "../src/core/record";
import { htmlEscape } from "../src/drawing";
import { readings } from "../src/readings";

test("both worlds, assumptions, Unicode explanation and citations survive file and link round trips", () => {
  const record = blank();
  record.pinned = { ...record.current };
  record.current.world = 24;
  record.note = "ὅρος — <a href='javascript:bad'>A & B</a>\nEvery / some / nullum.";
  record.citations = ["two-worlds", "deduction"];
  assert.deepEqual(parse(JSON.stringify(record)), record);
  assert.deepEqual(decode(encode(record)), record);
  assert.equal(htmlEscape(record.note).includes("<a"), false);
  const extra = {
    ...record,
    outcome: "valid",
    current: { ...record.current, conclusionTruth: true },
  };
  assert.deepEqual(parse(JSON.stringify(extra)), record);
});
test("invalid files and damaged links fail before state replacement", () => {
  for (const override of [
    { version: 2 },
    { format: "other" },
    { current: { ...blank().current, world: 256 } },
    { current: { ...blank().current, world: 1.5 } },
    { current: { ...blank().current, existence: -1 } },
    { current: { ...blank().current, lesson: "modal" } },
    { note: "x".repeat(4001) },
    { citations: ["forged"] },
    { citations: ["chain", "chain"] },
    { pinned: {} },
  ])
    assert.throws(() => parse(JSON.stringify({ ...blank(), ...override })));
  for (const text of ["null", "[]", "", '{"format":']) assert.throws(() => parse(text));
  assert.throws(() => decode("#notebook=%zz"));
  assert.throws(() => decode("#other=1"));
});
test("every annotated Greek phrase occurs in its reading and citations are unique", () => {
  assert.equal(new Set(readings.map((r) => r.id)).size, readings.length);
  for (const r of readings)
    for (const note of r.words) assert.ok(r.greek.includes(note.phrase), `${r.id}: ${note.phrase}`);
});
