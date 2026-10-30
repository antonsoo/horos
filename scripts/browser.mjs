import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { createServer } from "node:http";
import { extname, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { gzipSync } from "node:zlib";
import AxeBuilder from "@axe-core/playwright";
import { chromium, firefox } from "playwright";

const root = resolve("dist");
const output = resolve(process.env.REVIEW_OUTPUT || "docs/assets");
const scratch = resolve("test-results");
await mkdir(output, { recursive: true });
await mkdir(scratch, { recursive: true });
const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
const manifest = JSON.parse(await readFile("src/asset-manifest.json", "utf8"));
const mime = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".jpg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".woff2": "font/woff2",
  ".txt": "text/plain",
};
let unavailable = false;
const server = createServer(async (req, res) => {
  if (unavailable) {
    req.socket.destroy();
    return;
  }
  const url = new URL(req.url, "http://localhost");
  if (!url.pathname.startsWith("/horos/")) {
    res.writeHead(404).end();
    return;
  }
  const path = resolve(root, decodeURIComponent(url.pathname.slice(7)) || "index.html");
  if (!path.startsWith(`${root}/`)) {
    res.writeHead(404).end();
    return;
  }
  try {
    const bytes = await readFile(path);
    res.writeHead(200, {
      "Content-Type": mime[extname(path)] || "application/octet-stream",
      "Cache-Control": "no-store",
    });
    res.end(bytes);
  } catch {
    res.writeHead(404).end();
  }
});
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const base = process.env.REVIEW_BASE || `http://127.0.0.1:${server.address().port}/horos/`;
async function inventory(directory, prefix = "") {
  const entries = [];
  for (const entry of (await readdir(directory, { withFileTypes: true })).sort((a, b) =>
    a.name.localeCompare(b.name),
  )) {
    const path = prefix + entry.name;
    if (entry.isDirectory())
      entries.push(...(await inventory(resolve(directory, entry.name), `${path}/`)));
    else {
      const bytes = await readFile(resolve(directory, entry.name));
      entries.push({ path, bytes: bytes.length, sha256: hash(bytes) });
    }
  }
  return entries;
}
const report = {
  date: new Date().toISOString(),
  node: process.version,
  origin: process.env.REVIEW_BASE || "local production server",
  files: await inventory(root),
  journeys: [],
  faults: [],
};
async function contains(page, id, text) {
  await page
    .waitForFunction(({ id, text }) => document.getElementById(id)?.textContent.includes(text), {
      id,
      text,
    })
    .catch(async (error) => {
      console.error({ id, expected: text, actual: await page.locator(`#${id}`).textContent() });
      throw error;
    });
}
async function status(page, value) {
  await page.waitForFunction(
    (v) => document.getElementById("judgment").dataset.status === v,
    value,
  );
}
async function noOverflow(page) {
  const d = await page.evaluate(() => ({
    width: innerWidth,
    scroll: document.documentElement.scrollWidth,
  }));
  assert.ok(d.scroll <= d.width + 1, JSON.stringify(d));
}
async function download(page, selector) {
  const pending = page.waitForEvent("download");
  await page.locator(selector).click();
  const d = await pending;
  assert.equal(await d.failure(), null);
  return { name: d.suggestedFilename(), bytes: await readFile(await d.path()) };
}
async function displayedImageHash(page) {
  return page.evaluate(async () => {
    const img = document.getElementById("scan");
    const blob = window.sourceBlobs.get(img.src);
    if (!blob) throw new Error("No displayed source blob.");
    return Array.from(
      new Uint8Array(await crypto.subtle.digest("SHA-256", await blob.arrayBuffer())),
      (b) => b.toString(16).padStart(2, "0"),
    ).join("");
  });
}
function observeBlobs() {
  const create = URL.createObjectURL.bind(URL);
  const revoke = URL.revokeObjectURL.bind(URL);
  window.sourceBlobs = new Map();
  URL.createObjectURL = (blob) => {
    const url = create(blob);
    window.sourceBlobs.set(url, blob);
    return url;
  };
  URL.revokeObjectURL = (url) => {
    window.sourceBlobs.delete(url);
    revoke(url);
  };
}
function verifyEmbedded(html) {
  const data = [...html.matchAll(/data:(image\/jpeg|font\/woff2);base64,([A-Za-z0-9+/=]+)/g)].map(
    (m) => ({ mime: m[1], sha256: hash(Buffer.from(m[2], "base64")) }),
  );
  for (const asset of manifest.filter((a) => ["image/jpeg", "font/woff2"].includes(a.mime)))
    assert.ok(
      data.some((d) => d.sha256 === asset.sha256 && d.mime === asset.mime),
      asset.path,
    );
  assert.equal(data.length, 6);
  assert.ok(!html.includes("<script"));
}
const explanation =
  "Object 5 is C but not A. Every B is A and no C is B still hold.\nAristotle’s horse & stone substitutions preserve the premise forms while changing the conclusion. The two worlds therefore refute the proposed inference, even though its conclusion is true in the first world.";
const blank = {
  format: "horos",
  version: 1,
  current: { lesson: "two-worlds", kind: "all", existence: 7, world: 40 },
  pinned: null,
  note: "",
  citations: [],
};

try {
  for (const [name, engine] of [
    ["chromium", chromium],
    ["firefox", firefox],
  ]) {
    const browser = await engine.launch();
    try {
      for (const width of [1440, 375]) {
        const context = await browser.newContext({
          viewport: { width, height: 1000 },
          acceptDownloads: true,
        });
        await context.addInitScript(observeBlobs);
        const page = await context.newPage();
        const errors = [];
        page.on("pageerror", (e) => errors.push(e.message));
        await page.goto(base);
        await contains(page, "offline-status", "available offline");
        await contains(page, "scan-status", "Printed page 26");
        await status(page, "agreement");
        assert.ok(await page.getByRole("group", { name: "Choose an investigation" }).isVisible());
        await page.locator("#stone").click();
        await contains(page, "preset-note", "C = stones");
        await page.locator("#clear").click();
        assert.equal(await page.locator("#preset-note").textContent(), "");
        await page.locator("#undo").click();
        await contains(page, "preset-note", "C = stones");
        await page.locator("#reset").click();
        for (const id of ["conversion", "inhabitant", "chain"]) {
          const linked = await context.newPage();
          await linked.goto(`${base}?investigation=${id}#workshop`);
          assert.equal(
            await linked.locator(`[data-lesson="${id}"]`).getAttribute("aria-pressed"),
            "true",
          );
          assert.equal(await linked.locator("#reading").inputValue(), id);
          assert.ok(
            (await linked.locator("#investigation-link").getAttribute("href")).endsWith(
              `?investigation=${id}#workshop`,
            ),
          );
          await linked.close();
        }
        await page.goto(base);
        await contains(page, "scan-status", "Printed page 26");
        await contains(page, "offline-status", "available offline");
        await page.evaluate(() => scrollTo(0, 0));
        await noOverflow(page);
        await page.screenshot({
          path: resolve(output, `workshop-${name}-${width}.png`),
          fullPage: false,
        });
        await page
          .locator(".world-sheet")
          .screenshot({ path: resolve(output, `world-${name}-${width}.png`) });
        await page.locator("#pin").click();
        await page.locator("#region-5").focus();
        await page.keyboard.press("Space");
        await status(page, "existence");
        assert.equal(await page.evaluate(() => document.activeElement.id), "region-5");
        await page.locator("#region-4").click();
        await status(page, "counterexample");
        await contains(page, "comparison-note", "conclusion changes truth");
        await page.locator("#inspect").click();
        assert.deepEqual(await page.locator("#search-counts td").allTextContents(), [
          "243",
          "4",
          "8",
        ]);
        await page.locator(".trace summary").click();
        await contains(page, "constraint-trace", "Every required witness has an available region");
        await page.locator("#load-trace").click();
        await status(page, "counterexample");
        await page.locator("#undo").click();
        await page
          .locator(".trace")
          .screenshot({ path: resolve(output, `trace-${name}-${width}.png`) });
        await noOverflow(page);
        await page.locator("#conclusion").selectOption("none");
        await status(page, "agreement");
        await contains(page, "comparison-note", "Different questions");
        await page.locator("#conclusion").selectOption("all");
        await status(page, "counterexample");
        await page.locator("#reading").selectOption("two-worlds");
        await page.locator("#greek button").filter({ hasText: "παντὶ τῷ μέσῳ" }).click();
        await contains(page, "word-note", "every B is A");
        await page
          .locator("#reader")
          .screenshot({ path: resolve(output, `reader-${name}-${width}.png`) });
        await page.locator("#cite").click();
        await page.locator("#reading").selectOption("deduction");
        await contains(page, "scan-status", "Printed page 24");
        await page.locator("#cite").click();
        await page.locator("#note").fill(explanation);
        for (const p of [24, 25, 26, 28]) {
          await page.locator("#scan-page").selectOption(String(p));
          await contains(page, "scan-status", `Printed page ${p}`);
          assert.equal(
            await displayedImageHash(page),
            manifest.find((a) => a.printedPage === p).sha256,
          );
        }
        await page.locator("#zoom").click();
        const before = await page
          .locator("#scan-viewport")
          .evaluate((e) => ({ left: e.scrollLeft, top: e.scrollTop, width: e.scrollWidth }));
        assert.ok(before.width >= 2175);
        await noOverflow(page);
        await page.keyboard.press("ArrowRight");
        await page.keyboard.press("ArrowDown");
        await page.waitForFunction(() => document.getElementById("scan-viewport").scrollLeft > 0);
        await page.locator("#zoom").click();
        const scan = await new AxeBuilder({ page }).analyze();
        assert.deepEqual(
          scan.violations.map((v) => ({ id: v.id, nodes: v.nodes.map((n) => n.target) })),
          [],
        );
        const json = await download(page, "#save-json");
        const saved = JSON.parse(json.bytes);
        assert.equal(saved.current.world, 24);
        assert.equal(saved.pinned.world, 40);
        assert.equal(saved.note, explanation);
        assert.deepEqual(saved.citations, ["two-worlds", "deduction"]);
        const svg = await download(page, "#save-svg");
        assert.ok(svg.bytes.toString().includes("Object 5: In C; outside A and B"));
        const exported = await download(page, "#save-html");
        const html = exported.bytes.toString();
        verifyEmbedded(html);
        assert.ok(html.includes("horse &amp; stone"));
        const exportPath = resolve(scratch, `notebook-${name}-${width}.html`);
        await writeFile(exportPath, exported.bytes);
        const standalone = await context.newPage();
        const outgoing = [];
        standalone.on("request", (r) => {
          if (/^https?:/.test(r.url())) outgoing.push(r.url());
        });
        await standalone.goto(pathToFileURL(exportPath).href);
        await standalone.evaluate(() => document.fonts.ready);
        assert.equal(await standalone.locator(".source img").count(), 4);
        assert.ok(
          await standalone
            .locator(".source img")
            .evaluateAll((imgs) => imgs.every((i) => i.complete && i.naturalWidth === 2175)),
        );
        assert.deepEqual(outgoing, []);
        assert.equal(await standalone.evaluate(() => window.bad), undefined);
        await noOverflow(standalone);
        const notebookAxe = await new AxeBuilder({ page: standalone }).analyze();
        assert.deepEqual(
          notebookAxe.violations.map((v) => ({ id: v.id, nodes: v.nodes.map((n) => n.target) })),
          [],
        );
        const back = await download(standalone, 'a[download="horos-notebook.json"]');
        assert.deepEqual(JSON.parse(back.bytes), saved);
        if (name === "chromium" && width === 1440 && !process.env.REVIEW_BASE) {
          await standalone.pdf({
            path: resolve("examples/two-worlds.pdf"),
            format: "A4",
            printBackground: true,
            tagged: true,
            outline: true,
          });
          await writeFile("examples/two-worlds.html.gz", gzipSync(exported.bytes));
          await writeFile("examples/two-worlds.json", json.bytes);
          await writeFile("examples/two-worlds.svg", svg.bytes);
        }
        await standalone.close();
        await page.locator("#copy-link").click();
        const share = await page.locator("#share-text").inputValue();
        assert.ok(share.includes("#notebook="));
        const sharePage = await context.newPage();
        await sharePage.goto(share);
        await status(sharePage, "counterexample");
        assert.equal(await sharePage.locator("#note").inputValue(), explanation);
        await sharePage.locator("#region-0").click();
        assert.equal(sharePage.url(), share);
        await sharePage.close();
        await page
          .locator("#comparison")
          .screenshot({ path: resolve(output, `comparison-${name}-${width}.png`) });
        await page.locator('[data-lesson="inhabitant"]').click();
        await status(page, "agreement");
        await page.locator("#region-7").click();
        await status(page, "empty");
        await page.locator("#region-0").click();
        await status(page, "existence");
        await page.locator("#inspect").click();
        await page.locator(".trace summary").click();
        await contains(
          page,
          "constraint-trace",
          "C must have an inhabitant has no available region",
        );
        assert.ok(await page.locator("#load-trace").isDisabled());
        await page.locator("#inspect").click();
        await page.locator("#exists-c").uncheck();
        await status(page, "counterexample");
        await page.locator("#inspect").click();
        assert.deepEqual(await page.locator("#search-counts td").allTextContents(), [
          "224",
          "24",
          "7",
        ]);
        await page.locator("#exists-c").check();
        await contains(page, "search-verdict", "no counterexample");
        await status(page, "existence");
        await noOverflow(page);
        await page.locator('[data-lesson="conversion"]').click();
        await page.locator("#region-1").click();
        await status(page, "counterexample");
        await page.locator("#conclusion").selectOption("some");
        await status(page, "agreement");
        await page.locator("#inspect").click();
        await contains(page, "search-verdict", "no counterexample");
        await page.locator("#exists-b").uncheck();
        await page.locator("#region-3").click();
        await status(page, "counterexample");
        await page.locator('[data-lesson="chain"]').click();
        await page.locator("#region-6").click();
        await status(page, "premise");
        await page.locator("#undo").click();
        await status(page, "agreement");
        await page.locator("#inspect").click();
        await contains(page, "search-verdict", "no counterexample");
        await page.locator("#open-file").setInputFiles({
          name: "notebook.json",
          mimeType: "application/json",
          buffer: json.bytes,
        });
        await status(page, "counterexample");
        assert.equal(await page.locator("#note").inputValue(), explanation);
        await page.locator("#open-file").setInputFiles({
          name: "bad.json",
          mimeType: "application/json",
          buffer: Buffer.from(
            JSON.stringify({ ...saved, current: { ...saved.current, world: 256 } }),
          ),
        });
        await contains(page, "file-status", "out of range");
        await status(page, "counterexample");
        unavailable = true;
        await context.setOffline(true);
        // Navigate the real document with the origin refusing connections.
        await page.reload({ waitUntil: "domcontentloaded" });
        await contains(page, "offline-status", "available offline");
        await page.locator("#open-file").setInputFiles({
          name: "notebook.json",
          mimeType: "application/json",
          buffer: json.bytes,
        });
        await status(page, "counterexample");
        await page.locator("#reading").selectOption("inhabitant");
        await contains(page, "scan-status", "Printed page 28");
        assert.equal(
          await displayedImageHash(page),
          manifest.find((a) => a.printedPage === 28).sha256,
        );
        const offline = await download(page, "#save-html");
        assert.equal(hash(offline.bytes), hash(exported.bytes));
        await context.setOffline(false);
        unavailable = false;
        await noOverflow(page);
        assert.deepEqual(errors, []);
        report.journeys.push({
          browser: name,
          version: browser.version(),
          width,
          keyboard: true,
          sourcePages: 4,
          axeViolations: scan.violations.length,
          standaloneRequests: outgoing.length,
          notebookBytes: exported.bytes.length,
          notebookSha256: hash(exported.bytes),
          offlineReload: true,
          offlineExportIdentical: true,
          shareRoundTrip: true,
          allInvestigations: true,
        });
        await context.close();
        console.log(
          `${name} ${width}: actual counterexamples, sources, saved/reopened notebook, offline export passed`,
        );
      }

      // Faults use a separate context without a worker, so every held or damaged
      // response is actually seen by the source reader and exporter.
      const context = await browser.newContext({ serviceWorkers: "block", acceptDownloads: true });
      await context.addInitScript(observeBlobs);
      const page = await context.newPage();
      await page.goto(base);
      await contains(page, "scan-status", "Printed page 26");
      await page.locator("#pin").click();
      await page.locator("#note").fill("A reason worth keeping");
      assert.equal(await page.locator("#undo").textContent(), "Undo explanation edit");
      await page.locator("#undo").click();
      assert.equal(await page.locator("#note").inputValue(), "");
      await page.locator("#undo").click();
      assert.ok(await page.locator("#restore").isHidden());
      await page.locator("#redo").click();
      await page.locator("#redo").click();
      assert.equal(await page.locator("#note").inputValue(), "A reason worth keeping");
      assert.ok(await page.locator("#restore").isVisible());
      await page.evaluate(() => {
        const original = File.prototype.text;
        window.pendingFiles = new Map();
        File.prototype.text = function () {
          return new Promise((resolve, reject) => {
            window.pendingFiles.set(this.name, () => original.call(this).then(resolve, reject));
          });
        };
      });
      const importFile = (name, note) =>
        page.locator("#open-file").setInputFiles({
          name,
          mimeType: "application/json",
          buffer: Buffer.from(JSON.stringify({ ...blank, note })),
        });
      await importFile("slow.json", "old import");
      await page.locator("#note").fill("New reasoning while the file opens");
      await page.evaluate(() => window.pendingFiles.get("slow.json")());
      await contains(page, "file-status", "newer work is preserved");
      assert.equal(await page.locator("#note").inputValue(), "New reasoning while the file opens");
      await importFile("older.json", "older selection");
      await importFile("newer.json", "newest selection");
      await page.evaluate(() => window.pendingFiles.get("newer.json")());
      await contains(page, "file-status", "Notebook reopened");
      await page.evaluate(() => window.pendingFiles.get("older.json")());
      assert.equal(await page.locator("#note").inputValue(), "newest selection");
      await page.locator("#undo").click();
      assert.equal(await page.locator("#note").inputValue(), "New reasoning while the file opens");
      // Reset this context before the source and export fault scenarios.
      await page.reload();
      await contains(page, "scan-status", "Printed page 26");
      let release;
      let entered;
      let holding = new Promise((r) => {
        release = r;
      });
      let seen = new Promise((r) => {
        entered = r;
      });
      await context.route("**/sources/bekker-p25.jpg", async (route) => {
        entered();
        await holding;
        await route.continue().catch(() => {});
      });
      await page.locator("#reading").selectOption("conversion");
      await seen;
      await page.locator("#reading").selectOption("inhabitant");
      await contains(page, "scan-status", "Printed page 28");
      release();
      await page.waitForTimeout(150);
      assert.equal(
        await displayedImageHash(page),
        manifest.find((a) => a.printedPage === 28).sha256,
      );
      await context.unroute("**/sources/bekker-p25.jpg");
      const bytes = await readFile("public/sources/bekker-p24.jpg");
      const corrupt = Buffer.from(bytes);
      corrupt[100] ^= 1;
      await context.route("**/sources/bekker-p24.jpg", (route) =>
        route.fulfill({ status: 200, contentType: "image/jpeg", body: corrupt }),
      );
      await page.locator("#scan-page").selectOption("24");
      await contains(page, "scan-status", "failed its source check");
      assert.ok(await page.locator("#scan").isHidden());
      let unexpected = 0;
      page.on("download", () => unexpected++);
      await page.locator("#save-html").click();
      await contains(page, "file-status", "failed its source check");
      assert.equal(unexpected, 0);
      await context.unroute("**/sources/bekker-p24.jpg");
      // Freeze all notebook inputs at click time while a source response is held.
      holding = new Promise((r) => {
        release = r;
      });
      seen = new Promise((r) => {
        entered = r;
      });
      await context.route("**/sources/bekker-p24.jpg", async (route) => {
        entered();
        await holding;
        await route.continue().catch(() => {});
      });
      await page.locator("#open-file").setInputFiles({
        name: "start.json",
        mimeType: "application/json",
        buffer: Buffer.from(
          JSON.stringify({
            ...blank,
            note: "Captured explanation <script>window.bad=1</script>",
            citations: ["deduction"],
          }),
        ),
      });
      const pending = page.waitForEvent("download");
      await page.locator("#save-html").click();
      await seen;
      await page.locator("#stone").click();
      await page.locator("#note").fill("Changed after Save");
      await page.locator('[data-remove-citation="deduction"]').click();
      release();
      const d = await pending;
      const frozen = (await readFile(await d.path())).toString();
      assert.ok(frozen.includes("Captured explanation &lt;script&gt;window.bad=1&lt;/script&gt;"));
      assert.ok(!frozen.includes("<script"));
      assert.ok(!frozen.includes("Changed after Save"));
      const captured = JSON.parse(
        decodeURIComponent(frozen.match(/href="data:application\/json;charset=utf-8,([^"]+)"/)[1]),
      );
      assert.equal(captured.current.world, 40);
      assert.deepEqual(captured.citations, ["deduction"]);
      assert.ok(frozen.includes("Current world: The horse &amp; the stone"));
      await context.unroute("**/sources/bekker-p24.jpg");
      holding = new Promise((r) => {
        release = r;
      });
      seen = new Promise((r) => {
        entered = r;
      });
      await context.route("**/sources/bekker-p24.jpg", async (route) => {
        entered();
        await holding;
        await route.continue().catch(() => {});
      });
      const count = unexpected;
      await page.locator("#save-html").click();
      await seen;
      await page.locator("#cancel-export").click();
      await contains(page, "file-status", "canceled");
      release();
      await page.waitForTimeout(150);
      assert.equal(unexpected, count);
      await context.unroute("**/sources/bekker-p24.jpg");
      await context.close();
      const cachedContext = await browser.newContext();
      const cachedPage = await cachedContext.newPage();
      await cachedPage.goto(base);
      await contains(cachedPage, "offline-status", "available offline");
      await cachedContext.setOffline(true);
      unavailable = true;
      await cachedPage.evaluate(async () => {
        const edition = document.querySelector('meta[name="horos-edition"]').content;
        const cache = await caches.open(`horos-${edition}`);
        const url = new URL("sources/bekker-p28.jpg", location.href).href;
        const original = await cache.match(url);
        window.cacheOriginal = original.clone();
        const bytes = new Uint8Array(await original.arrayBuffer());
        bytes[100] ^= 1;
        await cache.put(url, new Response(bytes, { headers: { "Content-Type": "image/jpeg" } }));
        document.dispatchEvent(new Event("visibilitychange"));
      });
      await contains(cachedPage, "offline-status", "not fully available offline");
      await cachedPage.locator("#reading").selectOption("inhabitant");
      await contains(cachedPage, "scan-status", "failed its source check");
      await cachedPage.locator("#save-html").click();
      await contains(cachedPage, "file-status", "failed its source check");
      await cachedPage.evaluate(async () => {
        const edition = document.querySelector('meta[name="horos-edition"]').content;
        const cache = await caches.open(`horos-${edition}`);
        const url = new URL("sources/bekker-p28.jpg", location.href).href;
        await cache.delete(url);
        await (await caches.open("horos-00000000000000000000")).put(
          url,
          window.cacheOriginal.clone(),
        );
      });
      await cachedPage.locator("#retry-scan").click();
      await cachedPage.waitForFunction(() => {
        const text = document.getElementById("scan-status").textContent;
        return !text.startsWith("Loading") && !text.startsWith("Printed page");
      });
      assert.ok(await cachedPage.locator("#scan").isHidden());
      await cachedPage.evaluate(async () => {
        const edition = document.querySelector('meta[name="horos-edition"]').content;
        await (await caches.open(`horos-${edition}`)).put(
          new URL("sources/bekker-p28.jpg", location.href),
          window.cacheOriginal.clone(),
        );
        document.dispatchEvent(new Event("visibilitychange"));
      });
      await cachedPage.locator("#retry-scan").click();
      await contains(cachedPage, "scan-status", "Printed page 28");
      await contains(cachedPage, "offline-status", "available offline");
      unavailable = false;
      await cachedContext.close();
      report.faults.push({
        browser: name,
        lateSourceIgnored: true,
        namedUndoRedo: true,
        importPreservesNewerEdits: true,
        newestImportWins: true,
        corruptScanRefused: true,
        corruptExportRefused: true,
        exportSnapshotFrozen: true,
        cancellation: true,
        damagedOfflineCacheRefused: true,
        otherEditionCacheIgnored: true,
        restoredExactCacheRecovered: true,
      });
    } finally {
      await browser.close();
      unavailable = false;
    }
  }
  await writeFile(resolve(output, "browser-review.json"), `${JSON.stringify(report, null, 2)}\n`);
  console.log("Four browser journeys and both fault suites passed.");
} finally {
  await new Promise((r) => server.close(r));
}
