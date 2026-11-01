import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { gzipSync } from "node:zlib";
import AxeBuilder from "@axe-core/playwright";
import { chromium, firefox } from "playwright";
import { reviewServer } from "./review-server.mjs";

const out = resolve(process.argv[2] || "test-results/conditionals");
await mkdir(out, { recursive: true });
const server = reviewServer("dist");
await server.start();
const base = server.base;
const source = JSON.parse(await readFile("src/conditional-assets.json", "utf8"));
const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
const report = {
  date: new Date().toISOString(),
  origin: "local production server",
  journeys: [],
  faults: [],
  offline: [],
};
const explanation =
  "The present facts stay day + talking. I excluded day + silence by assumption, not by evidence.\nσυνάρτησις <script> & an ungraded explanation.";

async function contains(page, id, value) {
  await page.locator(`#${id}`).filter({ hasText: value }).waitFor();
}
async function download(page, id) {
  const wait = page.waitForEvent("download");
  await page.locator(`#${id}`).click();
  const d = await wait;
  assert.equal(await d.failure(), null);
  return { name: d.suggestedFilename(), bytes: await readFile(await d.path()) };
}
async function noOverflow(page) {
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
}
function observeBlobs() {
  const original = URL.createObjectURL.bind(URL);
  const revoke = URL.revokeObjectURL.bind(URL);
  window.sourceBlobs = new Map();
  URL.createObjectURL = (blob) => {
    const url = original(blob);
    window.sourceBlobs.set(url, blob);
    return url;
  };
  URL.revokeObjectURL = (url) => {
    window.sourceBlobs.delete(url);
    revoke(url);
  };
}
async function displayedSource(page, printedPage) {
  await contains(page, "source-status", `Complete printed page ${printedPage};`);
  return page.evaluate(async () => {
    const img = document.getElementById("source-image");
    const blob = window.sourceBlobs.get(img.src);
    await img.decode();
    return {
      sha256: [...new Uint8Array(await crypto.subtle.digest("SHA-256", await blob.arrayBuffer()))]
        .map((b) => b.toString(16).padStart(2, "0"))
        .join(""),
      width: img.naturalWidth,
      height: img.naturalHeight,
    };
  });
}
function verifyEmbedded(bytes) {
  const html = bytes.toString();
  const embedded = [
    ...html.matchAll(/data:(image\/jpeg|font\/woff2);base64,([A-Za-z0-9+/=]+)/g),
  ].map((m) => ({ mime: m[1], sha256: hash(Buffer.from(m[2], "base64")) }));
  assert.equal(embedded.length, 4);
  for (const item of source.filter((a) => ["image/jpeg", "font/woff2"].includes(a.mime)))
    assert.ok(
      embedded.some((x) => x.mime === item.mime && x.sha256 === item.sha256),
      item.path,
    );
  assert.ok(!html.includes("<script>"));
  assert.ok(html.includes("&lt;script&gt; &amp; an ungraded explanation."));
  return embedded;
}

try {
  for (const [engine, launch] of [
    ["chromium", chromium],
    ["firefox", firefox],
  ]) {
    const browser = await launch.launch({ headless: true });
    try {
      for (const width of [1440, 375]) {
        const context = await browser.newContext({
          viewport: { width, height: 1000 },
          serviceWorkers: "block",
          acceptDownloads: true,
        });
        await context.addInitScript(observeBlobs);
        const page = await context.newPage();
        const errors = [];
        page.on("pageerror", (e) => errors.push(e.message));
        await page.goto(base);
        await page
          .getByRole("navigation", { name: "Rooms" })
          .getByRole("link", { name: /Conditionals/ })
          .click();
        await contains(page, "philo-result", "True here");
        await contains(page, "connection-result", "A counterexample remains");
        const p92 = source.find((x) => x.printedPage === 92);
        assert.deepEqual(await displayedSource(page, 92), {
          sha256: p92.sha256,
          width: p92.width,
          height: p92.height,
        });
        await page.locator("#toggle-talk").focus();
        await page.keyboard.press("Space");
        await contains(page, "philo-result", "False here");
        await page.locator("#toggle-day").click();
        await contains(page, "philo-result", "True here");
        await page.locator("#reset").click();
        await page.locator("#pin").click();
        await page.locator("#allow-2").uncheck();
        await contains(page, "connection-result", "Passes this table");
        await contains(page, "comparison-note", "Only the admitted-case table has changed");
        await page.locator("#undo").click();
        await contains(page, "connection-result", "A counterexample remains");
        await page.locator("#redo").click();
        await contains(page, "connection-result", "Passes this table");
        await page.locator("#now-2").click();
        await page.locator("#draft-conflict").waitFor({ state: "visible" });
        await contains(page, "philo-result", "False here");
        await page.locator("#admit-current").click();
        await page.locator("#draft-conflict").waitFor({ state: "hidden" });
        await contains(page, "connection-result", "A counterexample remains");
        await page.locator("#empty-cases").click();
        await contains(page, "connection-result", "No admitted cases");
        await page.locator("#allow-0").check();
        await page.locator("#now-0").click();
        await page.locator("#vacuity-note").waitFor({ state: "visible" });
        await page.locator("#sentence").selectOption("identity");
        await contains(page, "connection-result", "Passes this table");
        assert.equal(await page.locator("#allow-2").isDisabled(), true);
        assert.equal(await page.locator("#allow-1").isDisabled(), true);
        await page.locator("#toggle-day").click();
        await contains(page, "now-label", "Night in both clauses");
        await contains(page, "philo-result", "True here");
        for (const id of ["philo", "diodorus", "atoms", "connection", "containment", "dispute"]) {
          await page.locator("#reading").selectOption(id);
          await page.locator("#greek button").first().click();
          assert.ok((await page.locator("#word-note").textContent()).length > 35);
          await noOverflow(page);
        }
        const p93 = source.find((x) => x.printedPage === 93);
        assert.deepEqual(await displayedSource(page, 93), {
          sha256: p93.sha256,
          width: p93.width,
          height: p93.height,
        });
        await page.locator("#zoom-source").click();
        await page.locator("#locate-source").click();
        await contains(page, "source-status", "Complete printed page 93;");
        await page.locator("#source-viewport").focus();
        const pan = await page.locator("#source-viewport").evaluate((n) => n.scrollTop);
        await page.keyboard.press("ArrowDown");
        assert.ok((await page.locator("#source-viewport").evaluate((n) => n.scrollTop)) > pan);
        await page.locator("#zoom-source").click();
        await page.locator("#reset").click();
        await page.locator("#pin").click();
        await page.locator("#allow-2").uncheck();
        await page.locator("#note").fill(explanation);
        const json = await download(page, "save-json");
        const record = JSON.parse(json.bytes);
        assert.equal(record.note, explanation);
        assert.equal(record.current.allowed, 11);
        assert.equal(record.pinned.allowed, 15);
        const svg = await download(page, "save-svg");
        assert.ok(svg.bytes.toString().includes("Excluding a row does not prove it impossible"));
        const html = await download(page, "save-html");
        const embedded = verifyEmbedded(html.bytes);
        await page.locator("#reset").click();
        await page
          .locator("#open-file")
          .setInputFiles({ name: json.name, mimeType: "application/json", buffer: json.bytes });
        await contains(page, "file-status", "Opened the conditional notebook");
        assert.equal(await page.locator("#note").inputValue(), explanation);
        await contains(page, "connection-result", "Passes this table");
        await page.locator("#open-file").setInputFiles({
          name: "bad.json",
          mimeType: "application/json",
          buffer: Buffer.from(
            JSON.stringify({ ...record, current: { sentence: "identity", now: 3, allowed: 15 } }),
          ),
        });
        await contains(page, "file-status", "cannot have different truth values");
        assert.equal(await page.locator("#note").inputValue(), explanation);
        await page.locator("#copy-link").click();
        const shared = await page.locator("#share-text").inputValue();
        const twin = await context.newPage();
        await twin.goto(shared);
        await contains(twin, "connection-result", "Passes this table");
        assert.equal(await twin.locator("#note").inputValue(), explanation);
        const axe = await new AxeBuilder({ page }).analyze();
        assert.deepEqual(
          axe.violations.map((v) => ({ id: v.id, nodes: v.nodes.map((n) => n.target) })),
          [],
        );
        await noOverflow(page);
        await page.locator("#experiment").evaluate((n) => n.scrollIntoView({ block: "start" }));
        await page.screenshot({ path: resolve(out, `${engine}-${width}.png`), fullPage: false });
        const htmlPath = resolve(out, `${engine}-${width}-reading.html`);
        await writeFile(htmlPath, html.bytes);
        const portable = await context.newPage();
        const requests = [];
        portable.on("request", (r) => {
          if (r.url().startsWith("http")) requests.push(r.url());
        });
        await portable.goto(pathToFileURL(htmlPath).href);
        await portable.evaluate(() => document.fonts.ready);
        assert.equal(await portable.locator(".source img").count(), 2);
        assert.equal(await portable.locator(".reading").count(), 6);
        assert.equal(await portable.locator("script").count(), 0);
        assert.ok(
          await portable
            .locator(".source img")
            .evaluateAll((imgs) => imgs.every((i) => i.complete && i.naturalWidth === 2096)),
        );
        const native = portable.getByRole("link", {
          name: "Download editable notebook",
          exact: true,
        });
        const dw = portable.waitForEvent("download");
        await native.click();
        const nd = await dw;
        assert.deepEqual(JSON.parse(await readFile(await nd.path(), "utf8")), record);
        assert.deepEqual(requests, []);
        const portableAxe = await new AxeBuilder({ page: portable }).analyze();
        assert.deepEqual(
          portableAxe.violations.map((v) => ({ id: v.id, nodes: v.nodes.map((n) => n.target) })),
          [],
        );
        if (engine === "chromium" && width === 1440) {
          await mkdir("examples/conditionals", { recursive: true });
          await writeFile("examples/conditionals/notebook.json", json.bytes);
          await writeFile("examples/conditionals/cases.svg", svg.bytes);
          await writeFile(
            "examples/conditionals/reading.html.gz",
            gzipSync(html.bytes, { level: 9 }),
          );
          await portable.pdf({
            path: "examples/conditionals/reading.pdf",
            format: "A4",
            printBackground: true,
          });
          await page.locator("#reader").scrollIntoViewIfNeeded();
          await page.screenshot({ path: resolve(out, "reader-desktop.png") });
        }
        assert.deepEqual(errors, []);
        report.journeys.push({
          engine,
          width,
          operated:
            "facts, tables, witness, conflicts, identity, empty and vacuous drafts, pin, history, six readings, keyboard panning, imports, sharing, native exports, portable reading",
          sources: [p92.sha256, p93.sha256],
          embedded,
          downloads: [json, svg, html].map((d) => ({
            name: d.name,
            bytes: d.bytes.length,
            sha256: hash(d.bytes),
          })),
          axeViolations: 0,
          pageErrors: errors,
        });
        await context.close();
        console.log(
          `${engine} ${width}: learner, source, download and portable reading journey passed`,
        );
      }

      // Both rooms share one edition and one verified inventory. Refuse the
      // actual origin after takeover; never fulfill "offline" from test code.
      const context = await browser.newContext({ acceptDownloads: true });
      await context.addInitScript(observeBlobs);
      const page = await context.newPage();
      await page.goto(`${base}conditionals.html`);
      await contains(page, "offline-status", "This edition is available offline");
      const other = await context.newPage();
      await other.goto(base);
      await contains(other, "offline-status", "This edition is available offline");
      const edition = await page.locator('meta[name="horos-edition"]').getAttribute("content");
      assert.equal(
        await other.locator('meta[name="horos-edition"]').getAttribute("content"),
        edition,
      );
      await server.stop();
      await page.reload();
      await other.reload();
      await contains(page, "offline-status", "This edition is available offline");
      await contains(other, "offline-status", "This edition is available offline");
      await page.locator("#toggle-talk").click();
      await contains(page, "philo-result", "False here");
      await page.locator("#reading").selectOption("dispute");
      await displayedSource(page, 93);
      const saved = await download(page, "save-html");
      assert.ok(saved.bytes.toString().includes("Who gets to choose the test?"));
      const badPath = "sources/conditionals/mutschmann-p92.jpg";
      await page.evaluate(
        async ({ edition, badPath }) => {
          const cache = await caches.open(`horos-${edition}`);
          await cache.delete(new URL(badPath, location.href));
        },
        { edition, badPath },
      );
      await page.locator("#reading").selectOption("philo");
      await contains(page, "source-status", "HTTP 503");
      await contains(page, "offline-status", "not fully available offline");
      await contains(other, "offline-status", "not fully available offline");
      await server.start();
      await page.locator("#retry-source").click();
      await displayedSource(page, 92);
      await contains(page, "offline-status", "This edition is available offline");
      await contains(other, "offline-status", "This edition is available offline");
      report.offline.push({
        engine,
        edition,
        originStopped: true,
        bothRoomsReloaded: true,
        offlineExportBytes: saved.bytes.length,
        sourceLossInvalidatedBothRooms: true,
        reconnectedSourceRestoredBothRooms: true,
      });
      await context.close();
      console.log(
        `${engine}: both rooms, genuine origin outage, source loss and verified recovery passed`,
      );

      // Failures and late completion are tested with worker handling disabled.
      const faults = await browser.newContext({ serviceWorkers: "block", acceptDownloads: true });
      await faults.addInitScript(observeBlobs);
      const p = await faults.newPage();
      await p.goto(`${base}conditionals.html`);
      await displayedSource(p, 92);
      const route = "**/sources/conditionals/mutschmann-p92.jpg";
      const original = await readFile("public/sources/conditionals/mutschmann-p92.jpg");
      const corrupt = Buffer.from(original);
      corrupt[120] ^= 1;
      await faults.route(route, (r) =>
        r.fulfill({ status: 200, contentType: "image/jpeg", body: corrupt }),
      );
      await p.locator("#retry-source").click();
      await contains(p, "source-status", "failed its source check");
      await p.locator("#save-html").click();
      await contains(p, "file-status", "failed its source check");
      await faults.unroute(route);
      let release;
      const delayed = new Promise((r) => {
        release = r;
      });
      await faults.route(route, async (r) => {
        await delayed;
        try {
          await r.fulfill({ status: 200, contentType: "image/jpeg", body: original });
        } catch {}
      });
      await p.locator("#reading").selectOption("philo");
      await contains(p, "source-status", "Loading and checking");
      await p.locator("#reading").selectOption("dispute");
      await displayedSource(p, 93);
      release();
      await faults.unroute(route);
      await p.locator("#source-image").evaluate((i) => i.decode());
      await contains(p, "source-status", "Complete printed page 93");
      let releaseExport;
      const held = new Promise((r) => {
        releaseExport = r;
      });
      await faults.route(route, async (r) => {
        await held;
        try {
          await r.fulfill({ status: 200, contentType: "image/jpeg", body: original });
        } catch {}
      });
      await p.locator("#save-html").click();
      await p.locator("#cancel-export").waitFor({ state: "visible" });
      await p.locator("#cancel-export").click();
      await contains(p, "file-status", "canceled");
      releaseExport();
      await faults.unroute(route);

      // Saving captures a value, rather than retaining a mutable reference to
      // the live notebook while source reads are pending.
      await p.locator("#reset").click();
      await p.locator("#note").fill("Captured before the source arrives.");
      let releaseSnapshot;
      const snapshotGate = new Promise((r) => {
        releaseSnapshot = r;
      });
      await faults.route(route, async (r) => {
        await snapshotGate;
        try {
          await r.fulfill({ status: 200, contentType: "image/jpeg", body: original });
        } catch {}
      });
      const frozenDownload = p.waitForEvent("download");
      await p.locator("#save-html").click();
      await p.locator("#cancel-export").waitFor({ state: "visible" });
      await p.locator("#note").fill("A later edit stays in the workshop.");
      await p.locator("#toggle-talk").click();
      releaseSnapshot();
      const frozen = await readFile(await (await frozenDownload).path(), "utf8");
      const nativeJson = /data:application\/json;charset=utf-8,([^"]+)/.exec(frozen);
      assert.ok(nativeJson);
      const captured = JSON.parse(decodeURIComponent(nativeJson[1]));
      assert.equal(captured.note, "Captured before the source arrives.");
      assert.equal(captured.current.now, 3);
      assert.equal(await p.locator("#note").inputValue(), "A later edit stays in the workshop.");
      await contains(p, "file-status", "later edits remain here");
      await faults.unroute(route);

      await p.evaluate(() => {
        const original = File.prototype.text;
        File.prototype.text = function () {
          if (this.name !== "slow.json") return original.call(this);
          return new Promise((resolve) => {
            window.releaseConditionalImport = async () => resolve(await original.call(this));
          });
        };
      });
      const slowRecord = Buffer.from(JSON.stringify({ ...captured, note: "The slow import." }));
      await p
        .locator("#open-file")
        .setInputFiles({ name: "slow.json", mimeType: "application/json", buffer: slowRecord });
      await p.waitForFunction(() => typeof window.releaseConditionalImport === "function");
      await p.locator("#note").fill("Keep edits made during the file read.");
      await p.evaluate(() => window.releaseConditionalImport());
      await contains(p, "file-status", "after your experiment changed");
      assert.equal(await p.locator("#note").inputValue(), "Keep edits made during the file read.");
      await p.evaluate(() => {
        delete window.releaseConditionalImport;
      });
      await p
        .locator("#open-file")
        .setInputFiles({ name: "slow.json", mimeType: "application/json", buffer: slowRecord });
      await p.waitForFunction(() => typeof window.releaseConditionalImport === "function");
      await p.locator("#open-file").setInputFiles({
        name: "newer.json",
        mimeType: "application/json",
        buffer: Buffer.from(JSON.stringify({ ...captured, note: "The newer file wins." })),
      });
      await contains(p, "file-status", "Opened the conditional notebook");
      await p.evaluate(() => window.releaseConditionalImport());
      assert.equal(await p.locator("#note").inputValue(), "The newer file wins.");
      report.faults.push({
        engine,
        sameLengthCorruptScanRejected: true,
        corruptExportRejected: true,
        latePageCannotReplaceSelection: true,
        canceledExport: true,
        exportSnapshotFrozen: true,
        importPreservesInterveningEdits: true,
        newestImportWins: true,
      });
      await faults.close();
    } finally {
      await browser.close();
    }
  }
} finally {
  await server.stop();
  await writeFile(resolve(out, "receipt.json"), `${JSON.stringify(report, null, 2)}\n`);
}
console.log(`Review receipt: ${resolve(out, "receipt.json")}`);
