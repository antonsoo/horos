// Replay a retained published build, not a synthetic second copy of today's build.
import assert from "node:assert/strict";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { chromium, firefox } from "playwright";
import { reviewServer } from "./review-server.mjs";

const [oldBuild, output = "test-results/published-upgrade"] = process.argv.slice(2);
assert.ok(oldBuild, "Pass the retained previous published build directory.");
await mkdir(output, { recursive: true });
const edition = (html) => /name="horos-edition" content="([a-f0-9]+)"/.exec(html)[1];
const before = edition(await readFile(resolve(oldBuild, "index.html"), "utf8"));
const after = edition(await readFile("dist/index.html", "utf8"));
assert.notEqual(before, after);
const server = reviewServer(oldBuild);
await server.start();
const results = [];
try {
  for (const [engine, api] of [
    ["chromium", chromium],
    ["firefox", firefox],
  ]) {
    server.use(oldBuild);
    const browser = await api.launch();
    const context = await browser.newContext({ acceptDownloads: true });
    const p = await context.newPage();
    try {
      await p.goto(server.base);
      await p.locator("#offline-status").filter({ hasText: "available offline" }).waitFor();
      await p.locator("#note").fill("Save this explanation before closing an old edition.");
      server.use("dist");
      await p.evaluate(async () => (await navigator.serviceWorker.getRegistration()).update());
      await p.waitForFunction(
        async () =>
          (await navigator.serviceWorker.getRegistration()).waiting?.state === "installed",
      );
      const next = await context.newPage();
      await next.goto(`${server.base}conditionals.html`);
      await next.locator("#offline-status").filter({ hasText: "close all Horos tabs" }).waitFor();
      await next.reload();
      await next.locator("#offline-status").filter({ hasText: "close all Horos tabs" }).waitFor();
      assert.equal(
        await p.locator("#note").inputValue(),
        "Save this explanation before closing an old edition.",
      );
      const pending = p.waitForEvent("download");
      await p.locator("#save-json").click();
      const saved = Buffer.from(await readFile(await (await pending).path()));
      assert.equal(JSON.parse(saved).note, "Save this explanation before closing an old edition.");
      await next.close();
      await p.close();
      const fresh = await context.newPage();
      await fresh.goto(`${server.base}conditionals.html`);
      await fresh
        .locator("#offline-status")
        .filter({ hasText: "This edition is available offline" })
        .waitFor();
      assert.equal(
        await fresh.locator('meta[name="horos-edition"]').getAttribute("content"),
        after,
      );
      const cacheNames = await fresh.evaluate(() => caches.keys());
      assert.ok(cacheNames.includes(`horos-${after}`));
      assert.ok(!cacheNames.includes(`horos-${before}`));
      const classes = await context.newPage();
      await classes.goto(server.base);
      await classes
        .locator("#offline-status")
        .filter({ hasText: "This edition is available offline" })
        .waitFor();
      await classes
        .locator("#open-file")
        .setInputFiles({ name: "old-notebook.json", mimeType: "application/json", buffer: saved });
      await classes.locator("#file-status").filter({ hasText: "Notebook reopened" }).waitFor();
      assert.equal(
        await classes.locator("#note").inputValue(),
        "Save this explanation before closing an old edition.",
      );
      await server.stop();
      await classes.reload();
      await fresh.reload();
      await fresh
        .locator("#offline-status")
        .filter({ hasText: "This edition is available offline" })
        .waitFor();
      await classes
        .locator("#offline-status")
        .filter({ hasText: "This edition is available offline" })
        .waitFor();
      results.push({
        engine,
        oldNotebookDownloadRetained: true,
        waitingEditionExplainedAfterReload: true,
        newEditionActivatedAfterClosingTabs: true,
        oldCacheRemoved: true,
        oldNotebookReopened: true,
        bothRoomsReloadedWithOriginStopped: true,
      });
      console.log(
        `${engine}: retained published edition -> waiting notice -> saved work -> new two-room offline edition`,
      );
    } catch (e) {
      console.error(
        engine,
        await Promise.all(
          context.pages().map(async (x) => ({
            url: x.url(),
            status: await x
              .locator("#offline-status")
              .textContent()
              .catch(() => "missing"),
          })),
        ),
      );
      throw e;
    } finally {
      await context.close();
      await browser.close();
      await server.start();
    }
  }
} finally {
  await server.stop();
  await writeFile(
    resolve(output, "receipt.json"),
    `${JSON.stringify(
      { date: new Date().toISOString(), before, after, retainedOldBuild: true, results },
      null,
      2,
    )}\n`,
  );
}
