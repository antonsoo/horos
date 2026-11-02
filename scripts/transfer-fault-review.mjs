import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { chromium, firefox } from "playwright";
import { transferServer } from "./transfer-server.mjs";

const out = resolve(process.env.REVIEW_OUTPUT || "test-results/transfer-faults");
await mkdir(out, { recursive: true });
const report = { date: new Date().toISOString(), cases: [] };
const rooms = [
  {
    id: "classes",
    route: "",
    select: "#scan-page",
    bad: "28",
    good: "25",
    path: "sources/bekker-p28.jpg",
    retry: "#retry-scan",
    image: "#scan",
    status: "#scan-status",
    ready: "Printed page 25",
    recovered: "Printed page 28",
  },
  {
    id: "conditionals",
    route: "conditionals.html",
    select: "#source-page",
    bad: "93",
    good: "92",
    path: "sources/conditionals/mutschmann-p93.jpg",
    retry: "#retry-source",
    image: "#source-image",
    status: "#source-status",
    ready: "Complete printed page 92",
    recovered: "Complete printed page 93",
  },
];
async function shown(page, selector, text, timeout = 30_000) {
  await page.locator(selector).filter({ hasText: text }).waitFor({ timeout });
}
async function until(predicate, timeout = 5000) {
  const start = Date.now();
  while (!predicate()) {
    if (Date.now() - start > timeout) throw new Error("Server condition timed out");
    await new Promise((done) => setTimeout(done, 25));
  }
}
for (const [engine, launcher] of [
  ["chromium", chromium],
  ["firefox", firefox],
]) {
  if (process.env.REVIEW_ENGINE && process.env.REVIEW_ENGINE !== engine) continue;
  const browser = await launcher.launch();
  try {
    for (const room of rooms) {
      const server = transferServer("dist");
      server.configure("fast");
      await server.start();
      const context = await browser.newContext({ serviceWorkers: "block", acceptDownloads: true });
      const page = await context.newPage();
      const note = "Keep this explanation when a source stalls or fails its identity check.";
      try {
        await page.goto(server.base + room.route);
        await page.locator(room.image).waitFor({ state: "visible" });
        await page.locator("#note").fill(note);
        server.configure("stall", room.path);
        const start = Date.now();
        await page.selectOption(room.select, room.bad);
        await shown(page, room.status, "stopped making progress", 25_000);
        const duration = Date.now() - start;
        assert.ok(duration >= 14_000 && duration < 23_000);
        assert.equal(await page.locator(room.image).isHidden(), true);
        assert.equal(await page.locator("#note").inputValue(), note);
        const stalled = server.requests
          .filter((r) => r.mode === "stall" && r.path.endsWith(room.path))
          .at(-1);
        await until(() => stalled.closedAt !== null);
        assert.equal(stalled.sent, 4096);
        server.configure("fast");
        await page.locator(room.retry).click();
        await shown(page, room.status, room.recovered);
        server.configure("stall", room.path);
        const count = server.requests.length;
        await page.locator(room.retry).click();
        await until(() => server.requests.length > count);
        const canceled = server.requests
          .filter((r) => r.mode === "stall" && r.path.endsWith(room.path))
          .at(-1);
        server.configure("fast");
        await page.selectOption(room.select, room.good);
        await shown(page, room.status, room.ready);
        await until(() => canceled.closedAt !== null);
        // Export must reject the same stalled body and recover on a new attempt.
        server.configure("stall", room.path);
        const exportStarted = Date.now();
        await page.locator("#save-html").click();
        await shown(page, "#file-status", "stopped making progress", 25_000);
        const exportMs = Date.now() - exportStarted;
        assert.ok(exportMs >= 14_000 && exportMs < 23_000);
        await page.locator("#save-html").click();
        await page.locator("#cancel-export").click();
        await shown(page, "#file-status", /canceled|cancelled/i);
        for (const mode of ["oversized", "truncated"]) {
          server.configure(mode, room.path);
          await page.selectOption(room.select, room.bad);
          await page.locator(room.retry).click();
          await shown(page, room.status, "does not match this edition");
          assert.equal(await page.locator(room.image).isHidden(), true);
          await page.selectOption(room.select, room.good);
          await shown(page, room.status, room.ready);
        }
        let headerMs = null;
        if (room.id === "classes") {
          server.configure("headers", room.path);
          const headerStarted = Date.now();
          await page.selectOption(room.select, room.bad);
          await shown(page, room.status, "did not begin sending", 70_000);
          headerMs = Date.now() - headerStarted;
          assert.ok(headerMs >= 59_000 && headerMs < 68_000);
        }
        server.configure("fast");
        await page.selectOption(room.select, room.bad);
        await page.locator(room.retry).click();
        await shown(page, room.status, room.recovered);
        assert.equal(await page.locator("#note").inputValue(), note);
        report.cases.push({
          engine,
          room: room.id,
          sourceStallMs: duration,
          exportStallMs: exportMs,
          headersMs: headerMs,
          selectionCancelsOldRead: true,
          explicitExportCancellation: true,
          oversizedRefused: true,
          truncatedRefused: true,
          successfulRetry: true,
          requests: server.requests,
        });
        console.log(
          `${engine} ${room.id}: stalled source/export, cancellation, oversized/truncated bodies and delayed headers passed`,
        );
      } catch (error) {
        await writeFile(
          resolve(out, `failure-${engine}-${room.id}.json`),
          JSON.stringify(
            {
              error: String(error),
              source: await page.locator(room.status).textContent(),
              export: await page.locator("#file-status").textContent(),
              requests: server.requests,
            },
            null,
            2,
          ),
        );
        throw error;
      } finally {
        await context.close();
        await server.stop();
      }
      // Exercise the worker's independently executing copy of the same verifier.
      const controlledServer = transferServer("dist");
      controlledServer.configure("fast");
      await controlledServer.start();
      const controlled = await browser.newContext({ acceptDownloads: true });
      const client = await controlled.newPage();
      try {
        await client.goto(controlledServer.base + room.route);
        await shown(client, "#offline-status", "This edition is available offline,");
        await client.locator("#note").fill(note);
        await client.evaluate(async (path) => {
          const edition = document.querySelector('meta[name="horos-edition"]').content;
          await (await caches.open(`horos-${edition}`)).delete(new URL(path, location.href));
        }, room.path);
        controlledServer.configure("stall", room.path);
        const start = Date.now();
        await client.selectOption(room.select, room.bad);
        await shown(client, room.status, "stopped making progress", 30_000);
        const stalledMs = Date.now() - start;
        assert.ok(stalledMs >= 14_000 && stalledMs < 26_000);
        await shown(client, "#offline-status", "not fully available offline", 25_000);
        controlledServer.configure("fast");
        await client.locator(room.retry).click();
        await shown(client, room.status, room.recovered);
        await shown(client, "#offline-status", "This edition is available offline,");
        assert.equal(await client.locator("#note").inputValue(), note);
        // Plain image reads do not use the page helper. The worker must still
        // refuse an incomplete body and notify the page about missing retention.
        await client.evaluate(async (path) => {
          const edition = document.querySelector('meta[name="horos-edition"]').content;
          await (await caches.open(`horos-${edition}`)).delete(new URL(path, location.href));
        }, room.path);
        controlledServer.configure("stall", room.path);
        const nativeStart = Date.now();
        const nativeResult = await client.evaluate(
          (path) =>
            new Promise((done) => {
              const image = new Image();
              image.onload = () => done("loaded");
              image.onerror = () => done("failed");
              image.src = new URL(path, location.href).href;
            }),
          room.path,
        );
        const nativeWorkerMs = Date.now() - nativeStart;
        assert.equal(nativeResult, "failed");
        assert.ok(nativeWorkerMs >= 14_000 && nativeWorkerMs < 26_000);
        await shown(client, "#offline-status", "not fully available offline", 25_000);
        controlledServer.configure("fast");
        await client.locator(room.retry).click();
        await shown(client, room.status, room.recovered);
        await shown(client, "#offline-status", "This edition is available offline,");
        report.cases.push({
          engine,
          room: room.id,
          controlledWorker: true,
          pageOwnsSourceTransfer: true,
          nativeWorkerStallMs: nativeWorkerMs,
          stalledMs,
          readinessWithdrawn: true,
          verifiedRecovery: true,
          requests: controlledServer.requests,
        });
        console.log(
          `${engine} ${room.id}: controlled worker stalled-body refusal and verified recovery passed`,
        );
      } finally {
        await controlled.close();
        await controlledServer.stop();
      }
    }
  } finally {
    await browser.close();
  }
}
await writeFile(
  resolve(out, `faults-${process.env.REVIEW_ENGINE || "both"}.json`),
  `${JSON.stringify(report, null, 2)}\n`,
);
