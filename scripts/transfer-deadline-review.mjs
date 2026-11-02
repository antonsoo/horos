import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { chromium } from "playwright";
import { transferServer } from "./transfer-server.mjs";

const out = resolve("test-results/transfer-deadline");
await mkdir(out, { recursive: true });
const server = transferServer("dist");
server.configure("fast");
await server.start();
const browser = await chromium.launch();
let heartbeat;
try {
  const context = await browser.newContext({ serviceWorkers: "block" });
  const page = await context.newPage();
  await page.goto(server.base);
  await page.locator("#scan").waitFor({ state: "visible" });
  await page.locator("#note").fill("A live trickle must not hold this notebook forever.");
  server.configure("drip", "sources/bekker-p28.jpg");
  const start = Date.now();
  await page.selectOption("#scan-page", "28");
  heartbeat = setInterval(
    () =>
      console.log(
        `Absolute deadline: ${Math.round((Date.now() - start) / 1000)} s; the server still sends one byte each second`,
      ),
    30_000,
  );
  await page
    .locator("#scan-status")
    .filter({ hasText: "three-minute transfer limit" })
    .waitFor({ timeout: 195_000 });
  const elapsedMs = Date.now() - start;
  assert.ok(elapsedMs >= 179_000 && elapsedMs < 190_000);
  assert.equal(
    await page.locator("#note").inputValue(),
    "A live trickle must not hold this notebook forever.",
  );
  assert.equal(await page.locator("#scan").isHidden(), true);
  const request = server.requests.find((r) => r.mode === "drip");
  assert.ok(request.sent > 4200 && request.sent < request.bytes);
  assert.ok(request.maxGapMs < 15_000);
  server.configure("fast");
  await page.locator("#retry-scan").click();
  await page.locator("#scan-status").filter({ hasText: "Printed page 28" }).waitFor();
  await writeFile(
    resolve(out, "review.json"),
    `${JSON.stringify({ date: new Date().toISOString(), engine: "chromium", version: browser.version(), elapsedMs, continuousTrickle: true, partialSourceRefused: true, notePreserved: true, retrySucceeded: true, request }, null, 2)}\n`,
  );
  console.log("Three-minute total deadline, preserved note and verified retry passed");
} finally {
  clearInterval(heartbeat);
  await browser.close();
  await server.stop();
}
