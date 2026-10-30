import assert from "node:assert/strict";
import test from "node:test";
import { NotebookHistory } from "../src/core/history";
import { blank, type Notebook } from "../src/core/record";

function required(record: Notebook | undefined): Notebook {
  assert.ok(record);
  return record;
}

test("prose edits are named, coalesced, and recoverable separately from board actions", () => {
  const history = new NotebookHistory();
  let record = blank();
  history.remember(record, "pin world");
  record.pinned = { ...record.current };
  for (const note of ["A", "An object", "An object outside A"]) {
    history.remember(record, "explanation edit", true);
    record.note = note;
  }
  assert.equal(history.undoLabel, "explanation edit");
  record = required(history.undo(record));
  assert.equal(record.note, "");
  assert.ok(record.pinned);
  assert.equal(history.redoLabel, "explanation edit");
  record = required(history.undo(record));
  assert.equal(record.pinned, null);
  record = required(history.redo(record));
  record = required(history.redo(record));
  assert.equal(record.note, "An object outside A");
  assert.ok(record.pinned);
});

test("a new edit branches history; separate editor visits and restored notebooks keep their own prose", () => {
  const history = new NotebookHistory();
  let record = blank();
  history.remember(record, "explanation edit", true);
  record.note = "first";
  history.endEdit();
  history.remember(record, "explanation edit", true);
  record.note = "second";
  record = required(history.undo(record));
  assert.equal(record.note, "first");
  history.remember(record, "open notebook");
  record = { ...blank(), note: "imported", citations: ["chain"] };
  assert.equal(history.redoLabel, undefined);
  record = required(history.undo(record));
  assert.equal(record.note, "first");
  assert.deepEqual(record.citations, []);
  record = required(history.redo(record));
  assert.equal(record.note, "imported");
  assert.deepEqual(record.citations, ["chain"]);
});
