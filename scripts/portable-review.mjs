// Inspect the actual script-free download at narrow widths, rather than only
// checking the workshop that creates it. Keep stress data out of public examples.
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { chromium, firefox } from "playwright";
import { reviewServer } from "./review-server.mjs";

const out = resolve(process.argv[2] || "test-results/portable-audit");
await mkdir(out, { recursive: true });
const server = reviewServer("dist");
const hosted = process.env.REVIEW_BASE;
if (!hosted) await server.start();
const base = hosted || server.base;
const note =
  '<script>window.bad=true</script> & <img src=x onerror="window.bad=true">\n' +
  "unbroken".repeat(450);
const hash = (b) => createHash("sha256").update(b).digest("hex");
const report = {
  date: new Date().toISOString(),
  base: hosted || "local production server",
  journeys: [],
};
try {
  for (const [engine, launch] of [
    ["chromium", chromium],
    ["firefox", firefox],
  ]) {
    const browser = await launch.launch();
    try {
      for (const room of ["classes", "conditionals"]) {
        const context = await browser.newContext({
          acceptDownloads: true,
          serviceWorkers: "block",
        });
        const p = await context.newPage();
        await p.goto(base + (room === "classes" ? "" : "conditionals.html"));
        await p
          .locator(room === "classes" ? "#scan-status" : "#source-status")
          .filter({ hasText: room === "classes" ? "Printed page" : "Complete printed page" })
          .waitFor();
        await p.locator("#note").fill(note);
        const wait = p.waitForEvent("download");
        await p.locator("#save-html").click();
        const download = await wait;
        assert.equal(await download.failure(), null);
        const bytes = await readFile(await download.path());
        const html = bytes.toString();
        assert.ok(html.includes("&lt;script&gt;window.bad=true&lt;/script&gt; &amp;"));
        const manifest = JSON.parse(
          await readFile(
            room === "classes" ? "src/asset-manifest.json" : "src/conditional-assets.json",
            "utf8",
          ),
        );
        const embedded = [
          ...html.matchAll(/data:(image\/jpeg|font\/woff2);base64,([A-Za-z0-9+/=]+)/g),
        ].map((m) => hash(Buffer.from(m[2], "base64")));
        assert.equal(
          embedded.length,
          manifest.filter((x) => ["image/jpeg", "font/woff2"].includes(x.mime)).length,
        );
        for (const a of manifest) {
          if (["image/jpeg", "font/woff2"].includes(a.mime))
            assert.ok(embedded.includes(a.sha256), a.path);
          else {
            const text = await readFile(resolve("public", a.path), "utf8");
            const esc = text
              .replaceAll("&", "&amp;")
              .replaceAll("<", "&lt;")
              .replaceAll(">", "&gt;")
              .replaceAll('"', "&quot;")
              .replaceAll("'", "&#39;");
            assert.ok(html.includes(esc), `Complete license/notice: ${a.path}`);
          }
        }
        const path = resolve(out, `${room}-${engine}.html`);
        await writeFile(path, bytes);
        const portable = await context.newPage();
        const outgoing = [];
        portable.on("request", (r) => {
          if (/^https?:/.test(r.url())) outgoing.push(r.url());
        });
        await portable.goto(pathToFileURL(path).href);
        await portable.evaluate(() => document.fonts.ready);
        assert.equal(await portable.locator("script").count(), 0);
        assert.equal(await portable.evaluate(() => window.bad), undefined);
        assert.equal(await portable.locator(".note").textContent(), note);
        const widths = [];
        for (const width of [375, 320]) {
          await portable.setViewportSize({ width, height: 900 });
          const geometry = await portable.evaluate(() => ({
            viewport: innerWidth,
            document: document.documentElement.scrollWidth,
            note: document.querySelector(".note").getBoundingClientRect().width,
          }));
          assert.ok(
            geometry.document <= width + 1,
            `${room} ${engine} ${width}: ${JSON.stringify(geometry)}`,
          );
          const scroller = portable.locator(".table-scroll").first();
          const dimensions = await scroller.evaluate((e) => ({
            client: e.clientWidth,
            scroll: e.scrollWidth,
          }));
          let keyboardScrolled = null;
          if (dimensions.scroll > dimensions.client) {
            await scroller.focus();
            await portable.keyboard.press("ArrowRight");
            await portable.waitForFunction(
              () => document.querySelector(".table-scroll").scrollLeft > 0,
            );
            keyboardScrolled = true;
          }
          widths.push({ ...geometry, table: dimensions, keyboardScrolled });
          if (width === 320) {
            await portable.locator(".note").evaluate((e) => e.scrollIntoView({ block: "start" }));
            await portable.screenshot({ path: resolve(out, `${room}-${engine}-320.png`) });
          }
        }
        const back = portable.waitForEvent("download");
        await portable
          .getByRole("link", { name: "Download editable notebook", exact: true })
          .click();
        const saved = JSON.parse(await readFile(await (await back).path(), "utf8"));
        assert.equal(saved.note, note);
        assert.deepEqual(outgoing, []);
        report.journeys.push({
          engine,
          room,
          widths,
          hostileTextEscaped: true,
          editableNoteRoundTrip: true,
          embeddedFiles: manifest.length,
          noNetworkRequests: true,
          htmlBytes: bytes.length,
        });
        await context.close();
        console.log(
          `${engine} ${room}: 320/375px, long prose, keyboard tables and complete portable sources passed`,
        );
      }
    } finally {
      await browser.close();
    }
  }
} finally {
  await server.stop();
  await writeFile(resolve(out, "receipt.json"), `${JSON.stringify(report, null, 2)}\n`);
}
