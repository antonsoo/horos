import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import AxeBuilder from "@axe-core/playwright";
import { chromium, firefox } from "playwright";
import { networkGate } from "./network-gate.mjs";
import { reviewServer } from "./review-server.mjs";

const output = resolve(process.env.REVIEW_OUTPUT || "test-results/existence");
await mkdir(output, { recursive: true });
await rm(resolve(output, "review.json"), { force: true });
const server = reviewServer("dist");
const hosted = process.env.REVIEW_BASE;
const gate = hosted ? networkGate(hosted) : null;
await gate?.start();
const report = {
  date: new Date().toISOString(),
  delivery: hosted || "local production build",
  journeys: [],
};
const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
async function text(page, selector, expected) {
  await page.locator(selector).filter({ hasText: expected }).waitFor();
}
async function status(page, expected) {
  await page.waitForFunction(
    (value) => document.getElementById("judgment")?.dataset.status === value,
    expected,
  );
}
async function download(page, selector) {
  const pending = page.waitForEvent("download");
  await page.locator(selector).click();
  const file = await pending;
  assert.equal(await file.failure(), null);
  return readFile(await file.path());
}
async function world(page) {
  return page
    .locator("#board [aria-pressed=true]")
    .evaluateAll((buttons) => buttons.map((b) => b.id));
}
async function fits(page) {
  assert.ok(
    await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
    "Page overflows",
  );
}
try {
  for (const [engine, launcher] of [
    ["chromium", chromium],
    ["firefox", firefox],
  ]) {
    const browser = await launcher.launch(gate ? { proxy: { server: gate.url } } : {});
    try {
      for (const width of [1440, 375]) {
        if (gate) await gate.start();
        else await server.start();
        const context = await browser.newContext({
          viewport: { width, height: 1000 },
          acceptDownloads: true,
        });
        const page = await context.newPage();
        const errors = [];
        page.on("pageerror", (e) => errors.push(e.message));
        await page.goto(`${hosted || server.base}?investigation=conversion`);
        await text(page, "#offline-status", "This edition is available offline");
        assert.equal(await page.locator("#existence-summary").isVisible(), false);
        await page.locator("#existence-disclosure > summary").focus();
        await page.keyboard.press("Enter");
        assert.equal(await page.locator("#existence-disclosure").getAttribute("open"), "");
        await page.selectOption("#conclusion", "some");
        await text(page, "#existence-summary", "Weakest sufficient requirements: B.");
        assert.equal(await page.locator("#existence-table tbody tr").count(), 8);
        assert.deepEqual(await world(page), ["region-3"]);
        const none = page.locator('[data-require-mask="0"]');
        await none.focus();
        await page.keyboard.press("Enter");
        assert.equal(await page.evaluate(() => document.activeElement.dataset.requireMask), "0");
        assert.deepEqual(await world(page), ["region-3"]);
        await status(page, "agreement");
        await page.locator('[data-refute-mask="0"]').click();
        await status(page, "counterexample");
        assert.deepEqual(await world(page), ["region-0"]);
        await page.locator('[data-require-mask="2"]').click();
        await status(page, "existence");
        assert.deepEqual(await world(page), ["region-0"]);
        await page.locator("#undo").click();
        await status(page, "counterexample");
        await page.locator("#redo").click();
        await status(page, "existence");
        await page.locator('[data-lesson="chain"]').click();
        await text(page, "#existence-summary", "No named class needs an inhabitant");
        await page.selectOption("#conclusion", "some");
        await text(page, "#existence-summary", "Weakest sufficient requirements: C.");
        await page.locator('[data-lesson="two-worlds"]').click();
        await text(page, "#existence-summary", "Existence alone cannot repair it");
        await page.locator('[data-refute-mask="7"]').click();
        await status(page, "counterexample");
        assert.deepEqual(await world(page), ["region-3", "region-4"]);
        await page.locator('[data-lesson="inhabitant"]').click();
        await page.locator('[data-refute-mask="0"]').click();
        await page.locator("#pin").click();
        await page.locator('[data-require-mask="4"]').click();
        await status(page, "existence");
        await text(page, "#comparison-note", "Different questions or existence assumptions");
        await page.locator('#existence-map a[href="#board"]').first().click();
        assert.ok(
          await page.locator("#board").evaluate((e) => {
            const r = e.getBoundingClientRect();
            return r.top < innerHeight && r.bottom > 0;
          }),
        );
        await page.locator('.existence a[href="#existence-map"]').click();
        await page.locator("#existence-reading").click();
        assert.equal(await page.locator("#reading").inputValue(), "inhabitant");
        await page.locator("#locate-scan").click();
        await text(page, "#scan-status", "excerpt area is in view");
        await page
          .locator("#note")
          .fill(
            "The same object outside all three classes refutes the particular conclusion when C may be empty. Requiring C excludes this world; it does not move its object or make this world prove the conclusion.",
          );
        await page.locator("#cite").click();
        const json = await download(page, "#save-json");
        const record = JSON.parse(json);
        assert.deepEqual(record.current, {
          lesson: "inhabitant",
          kind: "some",
          existence: 4,
          world: 1,
        });
        assert.deepEqual(record.pinned, { ...record.current, existence: 0 });
        const html = await download(page, "#save-html");
        const file = resolve(output, `reading-${engine}-${width}.html`);
        await writeFile(file, html);
        const saved = await context.newPage();
        const requests = [];
        saved.on("request", (r) => {
          if (/^https?:/.test(r.url())) requests.push(r.url());
        });
        await saved.goto(pathToFileURL(file).href);
        await saved.evaluate(() => document.fonts.ready);
        assert.equal(await saved.locator(".existence-table tbody tr").count(), 16);
        assert.equal(await saved.locator("script,button").count(), 0);
        assert.deepEqual(requests, []);
        const savedAxe = await new AxeBuilder({ page: saved }).analyze();
        assert.deepEqual(
          savedAxe.violations.map((v) => ({ id: v.id, targets: v.nodes.map((n) => n.target) })),
          [],
        );
        for (const size of [320, width]) {
          await saved.setViewportSize({ width: size, height: 1000 });
          await fits(saved);
        }
        assert.deepEqual(
          JSON.parse(await download(saved, 'a[download="horos-notebook.json"]')),
          record,
        );
        await saved.close();
        await page.locator("#existence-map").scrollIntoViewIfNeeded();
        await fits(page);
        const axe = await new AxeBuilder({ page }).analyze();
        assert.deepEqual(
          axe.violations.map((v) => ({ id: v.id, targets: v.nodes.map((n) => n.target) })),
          [],
        );
        await page
          .locator("#existence-map")
          .screenshot({ path: resolve(output, `${engine}-${width}.png`) });
        await page.locator("#copy-link").click();
        const link = await page.locator("#share-text").inputValue();
        const shared = await context.newPage();
        await shared.goto(link);
        await status(shared, "existence");
        assert.equal(
          await shared.locator('[data-require-mask="4"]').getAttribute("aria-pressed"),
          "true",
        );
        await shared.close();
        if (gate) await gate.stop();
        else await server.stop();
        await context.setOffline(true);
        await page.reload({ waitUntil: "domcontentloaded" });
        await text(page, "#offline-status", "This edition is available offline");
        await page
          .locator("#open-file")
          .setInputFiles({ name: "notebook.json", mimeType: "application/json", buffer: json });
        await text(page, "#file-status", "Notebook reopened");
        await status(page, "existence");
        await page.locator('.existence a[href="#existence-map"]').click();
        await text(page, "#existence-summary", "Weakest sufficient requirements: C.");
        assert.equal(hash(await download(page, "#save-html")), hash(html));
        await page.locator('.existence a[href="#existence-map"]').click();
        await page.locator('[data-require-mask="0"]').click();
        await status(page, "counterexample");
        await page.locator('[data-require-mask="4"]').click();
        await status(page, "existence");
        assert.deepEqual(errors, []);
        report.journeys.push({
          engine,
          version: browser.version(),
          width,
          keyboardFocusPreserved: true,
          allFourLessons: true,
          sameWorldPreserved: true,
          undoRedo: true,
          greekLocator: true,
          axeViolations: axe.violations.length,
          savedAxeViolations: savedAxe.violations.length,
          standaloneRequests: requests.length,
          notebookSha256: hash(html),
          jsonAndShareRoundTrips: true,
          offlineNetworkBoundary: gate
            ? "Public HTTPS tunnel closed for page and worker traffic"
            : "Local origin stopped and browser network disabled",
          originStoppedOfflineReload: !gate,
          offlineExportIdentical: true,
        });
        if (engine === "chromium" && width === 1440 && !hosted)
          await writeFile("examples/existence.json", json);
        await context.close();
        console.log(
          `${engine} ${width}: existence comparison, worlds, source, keyboard, downloads and stopped-origin offline passed`,
        );
      }
    } finally {
      await browser.close();
    }
  }
  await writeFile(resolve(output, "review.json"), `${JSON.stringify(report, null, 2)}\n`);
} finally {
  await gate?.stop();
  await server.stop();
}
