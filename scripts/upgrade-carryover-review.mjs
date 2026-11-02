import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { chromium, firefox } from "playwright";
import { reviewServer } from "./review-server.mjs";
import { waitForWaiting } from "./worker-state.mjs";

const old = process.argv[2];
assert.ok(old, "Pass the previously published build directory");
const out = resolve(process.argv[3] || "test-results/upgrade-carryover");
await mkdir(out, { recursive: true });
const before = /name="horos-edition" content="([a-f0-9]+)"/.exec(
  await readFile(resolve(old, "index.html"), "utf8"),
)[1];
const after = /name="horos-edition" content="([a-f0-9]+)"/.exec(
  await readFile("dist/index.html", "utf8"),
)[1];
const sources = [
  ...JSON.parse(await readFile("src/asset-manifest.json")),
  ...JSON.parse(await readFile("src/conditional-assets.json")),
].filter((file) => file.printedPage);
const report = { date: new Date().toISOString(), before, after, results: [] };
const server = reviewServer(old);
await server.start();
try {
  for (const [engine, launcher] of [
    ["chromium", chromium],
    ["firefox", firefox],
  ]) {
    server.use(old);
    await server.start();
    const browser = await launcher.launch();
    const context = await browser.newContext({ acceptDownloads: true });
    const page = await context.newPage();
    try {
      await page.goto(server.base);
      await page
        .locator("#offline-status")
        .filter({ hasText: "This edition is available offline" })
        .waitFor();
      await page
        .locator("#note")
        .fill("Keep this old-edition explanation through an offline activation.");
      const pending = page.waitForEvent("download");
      await page.locator("#save-json").click();
      const notebook = await readFile(await (await pending).path());
      server.use("dist");
      await page.evaluate(async () => (await navigator.serviceWorker.getRegistration()).update());
      await waitForWaiting(page);
      assert.equal(await page.locator("#note").inputValue(), JSON.parse(notebook).note);
      const promoted = await page.evaluate(
        async ({ edition, sources }) => {
          const cache = await caches.open(`horos-${edition}`);
          const rows = [];
          for (const file of sources) {
            const response = await cache.match(new URL(file.path, location.href));
            if (!response) throw new Error(`Source not carried forward: ${file.path}`);
            const bytes = await response.arrayBuffer();
            const sha256 = Array.from(
              new Uint8Array(await crypto.subtle.digest("SHA-256", bytes)),
              (b) => b.toString(16).padStart(2, "0"),
            ).join("");
            if (sha256 !== file.sha256)
              throw new Error(`Wrong carried-forward source: ${file.path}`);
            rows.push({ path: file.path, sha256 });
          }
          return rows;
        },
        { edition: after, sources },
      );
      // Close the network before the old tab: activation may not discard all
      // reading material merely because installation was deliberately short.
      await server.stop();
      await context.setOffline(true);
      await page.close();
      const fresh = await context.newPage();
      await fresh.goto(server.base);
      await fresh
        .locator("#offline-status")
        .filter({ hasText: "This edition is available offline" })
        .waitFor();
      assert.equal(
        await fresh.locator('meta[name="horos-edition"]').getAttribute("content"),
        after,
      );
      await fresh.locator("#open-file").setInputFiles({
        name: "old-notebook.json",
        mimeType: "application/json",
        buffer: notebook,
      });
      await fresh.locator("#file-status").filter({ hasText: "Notebook reopened" }).waitFor();
      assert.equal(await fresh.locator("#note").inputValue(), JSON.parse(notebook).note);
      const other = await context.newPage();
      await other.goto(`${server.base}conditionals.html`);
      await other
        .locator("#offline-status")
        .filter({ hasText: "This edition is available offline" })
        .waitFor();
      await other.selectOption("#reading", "dispute");
      await other
        .locator("#source-status")
        .filter({ hasText: "Complete printed page 93" })
        .waitFor();
      const caches = await fresh.evaluate(() => window.caches.keys());
      assert.ok(caches.includes(`horos-${after}`));
      assert.ok(!caches.includes(`horos-${before}`));
      report.results.push({
        engine,
        version: browser.version(),
        sixVerifiedSourcesCarriedForward: promoted,
        networkClosedBeforeOldTabsClosed: true,
        offlineActivationSucceeded: true,
        oldNotebookReopened: true,
        bothRoomsAvailable: true,
        oldCachePrunedAfterCompleteVerification: true,
        oldNotebookSha256: createHash("sha256").update(notebook).digest("hex"),
      });
      console.log(
        `${engine}: actual published edition -> verified carryover -> offline activation -> reopened notebook passed`,
      );
    } finally {
      await context.close();
      await browser.close();
    }
  }
  await writeFile(resolve(out, "review.json"), `${JSON.stringify(report, null, 2)}\n`);
} finally {
  await server.stop();
}
