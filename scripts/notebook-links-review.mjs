import assert from "node:assert/strict";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { chromium, firefox } from "playwright";
import { reviewServer } from "./review-server.mjs";

const out = resolve(process.env.REVIEW_OUTPUT || "test-results/notebook-links");
await mkdir(out, { recursive: true });
const server = reviewServer("dist");
if (!process.env.REVIEW_BASE) await server.start();
const base = process.env.REVIEW_BASE || server.base;
const report = {
  date: new Date().toISOString(),
  origin: process.env.REVIEW_BASE || "local production build",
  journeys: [],
};
const rooms = [
  {
    id: "classes",
    route: "",
    prefix: "notebook",
    record: {
      format: "horos",
      version: 1,
      current: { lesson: "inhabitant", kind: "some", existence: 0, world: 1 },
      pinned: { lesson: "chain", kind: "all", existence: 0, world: 128 },
      note: "A shared class notebook, opened in this existing tab.",
      citations: ["inhabitant"],
    },
  },
  {
    id: "conditionals",
    route: "conditionals.html",
    prefix: "conditional",
    record: {
      format: "horos-conditionals",
      version: 1,
      current: { sentence: "identity", now: 0, allowed: 1 },
      pinned: { sentence: "speech", now: 3, allowed: 15 },
      note: "A shared conditional notebook, opened in this existing tab.",
    },
  },
];
async function nativeExported(page) {
  const pending = page.waitForEvent("download");
  await page.locator("#save-json").click();
  return JSON.parse(await readFile(await (await pending).path(), "utf8"));
}
// Inspect intermediate records at the actual save handler, without triggering
// Chromium's limit of ten rapid native downloads. Two native downloads below
// separately verify the browser's delivery of the exact same record.
async function exported(page) {
  await page.evaluate(() => {
    window.savedRecord = null;
    const capture = async (event) => {
      const anchor = event.target.closest("a[download]");
      if (!anchor) return;
      event.preventDefault();
      document.removeEventListener("click", capture, true);
      const blob = window.savedBlobs.get(anchor.href);
      window.savedRecord = JSON.parse(await blob.text());
    };
    document.addEventListener("click", capture, true);
  });
  await page.locator("#save-json").click();
  await page.waitForFunction(() => window.savedRecord !== null);
  return page.evaluate(() => window.savedRecord);
}
async function navigateHash(page, hash) {
  await page.evaluate(async (hash) => {
    const change = new Promise((done) => addEventListener("hashchange", done, { once: true }));
    location.hash = hash;
    await change;
  }, hash);
}
try {
  for (const [engine, launcher] of [
    ["chromium", chromium],
    ["firefox", firefox],
  ]) {
    const browser = await launcher.launch();
    try {
      for (const room of rooms) {
        const context = await browser.newContext({ acceptDownloads: true });
        const page = await context.newPage();
        await page.addInitScript(() => {
          window.savedBlobs = new Map();
          const create = URL.createObjectURL.bind(URL);
          const revoke = URL.revokeObjectURL.bind(URL);
          URL.createObjectURL = (blob) => {
            const url = create(blob);
            window.savedBlobs.set(url, blob);
            return url;
          };
          URL.revokeObjectURL = (url) => {
            window.savedBlobs.delete(url);
            revoke(url);
          };
        });
        await page.goto(base + room.route);
        await page.locator("#note").fill("Keep this earlier unsaved explanation.");
        const previous = await nativeExported(page);
        const sharedHash = `#${room.prefix}=${encodeURIComponent(JSON.stringify(room.record))}`;
        await navigateHash(page, sharedHash);
        assert.deepEqual(await exported(page), room.record);
        await page.locator("#undo").click();
        assert.deepEqual(await exported(page), previous);
        await page.locator("#redo").click();
        assert.deepEqual(await exported(page), room.record);
        await page.locator("#note").fill("A later explanation preserved on a bad link.");
        const edited = await exported(page);
        await navigateHash(page, `#${room.prefix}=%zz`);
        await page.locator("#file-status").filter({ hasText: "damaged text encoding" }).waitFor();
        assert.deepEqual(await exported(page), edited);
        await navigateHash(page, "#reader");
        assert.deepEqual(await exported(page), edited);
        await page.goBack();
        assert.deepEqual(await exported(page), edited);
        await page.goBack();
        await page.waitForFunction(
          (note) => document.getElementById("note").value === note,
          room.record.note,
        );
        assert.deepEqual(await exported(page), room.record);
        await page.goForward();
        assert.deepEqual(await exported(page), room.record);
        // Hold a real File.text promise, then open an identical shared record.
        // The newer navigation must win even if it makes no data change.
        await page.evaluate(() => {
          const original = File.prototype.text;
          File.prototype.text = function () {
            if (this.name !== "delayed.json") return original.call(this);
            window.fileReadStarted = true;
            return new Promise((resolve) => {
              window.finishFileRead = resolve;
            });
          };
        });
        const delayed = {
          ...room.record,
          note: "This older file must never replace the shared notebook.",
        };
        await page.locator("#open-file").setInputFiles({
          name: "delayed.json",
          mimeType: "application/json",
          buffer: Buffer.from(JSON.stringify(delayed)),
        });
        await page.waitForFunction(() => window.fileReadStarted);
        await navigateHash(page, sharedHash);
        await page.evaluate((text) => window.finishFileRead(text), JSON.stringify(delayed));
        // A native download task runs after the file promise's continuation.
        assert.deepEqual(await exported(page), room.record);
        assert.deepEqual(await nativeExported(page), room.record);
        report.journeys.push({
          engine,
          version: browser.version(),
          room: room.id,
          sameTabLink: true,
          nativeJsonDownloads: 2,
          undoRedo: true,
          invalidLinkPreservesEdits: true,
          ordinaryFragmentPreservesEdits: true,
          browserHistory: true,
          olderImportCannotReplaceSharedRecord: true,
        });
        await context.close();
        console.log(
          `${engine} ${room.id}: same-tab links, history, undo and pending-import priority passed`,
        );
      }
    } finally {
      await browser.close();
    }
  }
  await writeFile(resolve(out, "review.json"), `${JSON.stringify(report, null, 2)}\n`);
} finally {
  await server.stop();
}
