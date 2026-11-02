import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { chromium, firefox } from "playwright";
import { transferServer } from "./transfer-server.mjs";

const out = resolve(process.env.REVIEW_OUTPUT || "test-results/cold-transfer");
await mkdir(out, { recursive: true });
const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
const report = { date: new Date().toISOString(), bytesPerSecond: 128_000, journeys: [] };
const rooms = [
  {
    id: "classes",
    route: "",
    status: "#scan-status",
    image: "#scan",
    source: "sources/bekker-p26.jpg",
    note: "Keep this class explanation through a cold transfer.",
    ready: "Printed page 26",
  },
  {
    id: "conditionals",
    route: "conditionals.html",
    status: "#source-status",
    image: "#source-image",
    source: "sources/conditionals/mutschmann-p92.jpg",
    note: "Keep this conditional explanation through a cold transfer.",
    ready: "Complete printed page 92",
  },
];
for (const [engine, launcher] of [
  ["chromium", chromium],
  ["firefox", firefox],
]) {
  if (process.env.REVIEW_ENGINE && process.env.REVIEW_ENGINE !== engine) continue;
  const browser = await launcher.launch();
  try {
    for (const room of rooms) {
      const server = transferServer("dist", report.bytesPerSecond);
      await server.start();
      const context = await browser.newContext({
        viewport: { width: 375, height: 1000 },
        acceptDownloads: true,
      });
      const page = await context.newPage();
      await page.addInitScript(() => {
        window.sourceBlobs = new Map();
        const create = URL.createObjectURL.bind(URL);
        const revoke = URL.revokeObjectURL.bind(URL);
        URL.createObjectURL = (blob) => {
          const url = create(blob);
          window.sourceBlobs.set(url, blob);
          return url;
        };
        URL.revokeObjectURL = (url) => {
          window.sourceBlobs.delete(url);
          revoke(url);
        };
      });
      const errors = [];
      page.on("pageerror", (e) => errors.push(e.message));
      const start = Date.now();
      let heartbeat;
      try {
        await page.goto(server.base + room.route, { waitUntil: "domcontentloaded" });
        await page.locator("#note").fill(room.note);
        const download = page.waitForEvent("download", { timeout: 210_000 });
        await page.locator("#save-html").click();
        heartbeat = setInterval(async () => {
          const state = await page
            .evaluate(() => ({
              source:
                document.getElementById("scan-status")?.textContent ||
                document.getElementById("source-status")?.textContent,
              export: document.getElementById("file-status").textContent,
              offline: document.getElementById("offline-status").textContent,
            }))
            .catch(() => ({}));
          console.log(
            `${engine} ${room.id}: ${Math.round((Date.now() - start) / 1000)} s, ${server.sent} shared bytes`,
            JSON.stringify(state),
          );
        }, 20_000);
        const saved = await download;
        assert.equal(await saved.failure(), null);
        const html = await readFile(await saved.path());
        assert.ok(html.toString().includes(room.note));
        const exportedAt = Date.now() - start;
        await page
          .locator(room.status)
          .filter({ hasText: room.ready })
          .waitFor({ timeout: 180_000 });
        assert.ok(await page.locator(room.image).isVisible());
        await page
          .locator("#offline-status")
          .filter({
            hasText: /This edition is available offline,|Offline installation did not complete/,
          })
          .waitFor({ timeout: 240_000 });
        assert.match(
          await page.locator("#offline-status").textContent(),
          /This edition is available offline,/,
          "The installation lifecycle must finish; extending a fetch timer alone is insufficient",
        );
        assert.equal(await page.locator("#note").inputValue(), room.note);
        assert.equal(await page.evaluate(() => !!navigator.serviceWorker.controller), true);
        const allReadyAt = Date.now() - start;
        const source = await readFile(`public/${room.source}`);
        const observedSource = await page.evaluate(async (id) => {
          const img = document.querySelector(id);
          const blob = window.sourceBlobs.get(img.src);
          if (!blob) throw new Error("No current source blob");
          const bytes = await blob.arrayBuffer();
          return Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", bytes)), (b) =>
            b.toString(16).padStart(2, "0"),
          ).join("");
        }, room.image);
        assert.equal(observedSource, hash(source));
        const longBodies = server.requests.filter(
          (r) => r.closedAt && r.sent === r.bytes && r.closedAt - r.at > 20_000,
        );
        assert.ok(longBodies.length, "A warm or fast run would miss the original defect");
        assert.ok(longBodies.every((r) => r.maxGapMs < 15_000));
        server.online = false;
        await context.setOffline(true);
        // Preserve the notebook explicitly: ordinary navigation fragments do not save edits.
        const jsonDownload = page.waitForEvent("download");
        await page.locator("#save-json").click();
        const json = await readFile(await (await jsonDownload).path());
        await page.reload({ waitUntil: "domcontentloaded" });
        await page
          .locator("#offline-status")
          .filter({ hasText: "This edition is available offline," })
          .waitFor();
        await page
          .locator("#open-file")
          .setInputFiles({ name: "notebook.json", mimeType: "application/json", buffer: json });
        await page.waitForFunction(
          (note) => document.getElementById("note").value === note,
          room.note,
        );
        const offlineDownload = page.waitForEvent("download");
        await page.locator("#save-html").click();
        const offlineHtml = await readFile(await (await offlineDownload).path());
        assert.equal(hash(offlineHtml), hash(html));
        assert.deepEqual(errors, []);
        report.journeys.push({
          engine,
          edition: await page.locator('meta[name="horos-edition"]').getAttribute("content"),
          version: browser.version(),
          room: room.id,
          exportedAtMs: exportedAt,
          allReadyAtMs: allReadyAt,
          sourceSha256: observedSource,
          notebookSha256: hash(html),
          continuousBodiesOverTwentySeconds: longBodies.length,
          offlineExportIdentical: true,
          notePreserved: true,
          requests: server.requests,
        });
        console.log(
          `${engine} ${room.id}: cold reading, export, full install and offline replay passed`,
        );
      } catch (error) {
        await writeFile(
          resolve(out, `failure-${engine}-${room.id}.json`),
          `${JSON.stringify({ date: new Date().toISOString(), error: String(error), source: await page.locator(room.status).textContent(), export: await page.locator("#file-status").textContent(), offline: await page.locator("#offline-status").textContent(), requests: server.requests }, null, 2)}\n`,
        );
        throw error;
      } finally {
        clearInterval(heartbeat);
        await context.close();
        await server.stop();
      }
    }
  } finally {
    await browser.close();
  }
}
await writeFile(
  resolve(out, `cold-${process.env.REVIEW_ENGINE || "both"}.json`),
  `${JSON.stringify(report, null, 2)}\n`,
);
