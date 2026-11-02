import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import test from "node:test";
import { verifiedTransferRuntime } from "../src/verified-transfer";

const transfer = verifiedTransferRuntime();
const bytes = new Uint8Array([0, 255, 34, 10, 128, 9]);
const identity = {
  bytes: bytes.byteLength,
  sha256: createHash("sha256").update(bytes).digest("hex"),
};

test("retained bytes are verified across arbitrary response chunks", async () => {
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(bytes.slice(0, 2));
      controller.enqueue(bytes.slice(2, 3));
      controller.enqueue(bytes.slice(3));
      controller.close();
    },
  });
  assert.deepEqual(await transfer.readBytes(new Response(stream), identity), bytes);
});

test("a surplus response is canceled at the first oversized chunk", async () => {
  let canceled = false;
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(new Uint8Array(100));
    },
    cancel() {
      canceled = true;
    },
  });
  await assert.rejects(transfer.readBytes(new Response(stream), identity), /too many bytes/);
  assert.equal(canceled, true);
});

test("a truncated or substituted response cannot become a source", async () => {
  await assert.rejects(
    transfer.readBytes(new Response(bytes.slice(0, -1)), identity),
    /wrong length/,
  );
  const substituted = bytes.slice();
  substituted[0] = 1;
  await assert.rejects(
    transfer.readBytes(new Response(substituted), identity),
    /failed its source check/,
  );
});

test("canceling a retained-body read releases its pending reader", async () => {
  let canceled = false;
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(bytes.slice(0, 1));
    },
    cancel() {
      canceled = true;
    },
  });
  const controller = new AbortController();
  const pending = transfer.readBytes(new Response(stream), identity, controller.signal);
  const reason = new DOMException("Another source was selected", "AbortError");
  controller.abort(reason);
  await assert.rejects(pending, (e) => e === reason);
  assert.equal(canceled, true);
});
