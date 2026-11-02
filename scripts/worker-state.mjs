/** Wait for the lifecycle event itself, including all install waitUntil work. */
export async function waitForWaiting(page, timeoutMs = 90_000) {
  await page.evaluate(async (timeoutMs) => {
    const registration = await navigator.serviceWorker.getRegistration();
    if (!registration) throw new Error("No Horos worker registration exists");
    await new Promise((resolve, reject) => {
      const watched = new Set();
      const deadline = setTimeout(() => {
        cleanup();
        reject(new Error("The replacement worker did not finish installation"));
      }, timeoutMs);
      function cleanup() {
        clearTimeout(deadline);
        registration.removeEventListener("updatefound", inspect);
        for (const worker of watched) worker.removeEventListener("statechange", inspect);
      }
      function inspect() {
        if (registration.waiting?.state === "installed") {
          cleanup();
          resolve();
          return;
        }
        for (const worker of [registration.installing, registration.waiting]) {
          if (!worker || watched.has(worker)) continue;
          watched.add(worker);
          worker.addEventListener("statechange", inspect);
        }
      }
      registration.addEventListener("updatefound", inspect);
      inspect();
    });
  }, timeoutMs);
}
