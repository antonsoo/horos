import { currentEdition, type EditionFile, editionFileBytes } from "./edition-files";

export function installOffline(status: HTMLElement): void {
  if (import.meta.env.DEV) {
    status.textContent = "Offline installation is available in the production build.";
    return;
  }
  if (!("serviceWorker" in navigator)) {
    status.textContent =
      "This browser cannot install an offline edition. Save a notebook to read offline.";
    return;
  }
  const expected = currentEdition();
  let request = 0;
  let registration: ServiceWorkerRegistration | undefined;
  let channel: MessageChannel | undefined;
  let timeout: number | undefined;
  let repairTask: Promise<void> | undefined;
  let repairController: AbortController | undefined;
  let repairOwner: ServiceWorker | undefined;
  const updateNotice =
    "A newer edition is ready. Save your notebook in each Horos tab, close all Horos tabs, then reopen Horos to finish the update.";
  const incomplete =
    "This edition is not fully available offline. Connect and reload, or save a notebook.";
  function closeInventory(): void {
    clearTimeout(timeout);
    channel?.port1.close();
    channel = undefined;
  }
  function missingFiles(value: unknown): EditionFile[] | undefined {
    if (!Array.isArray(value)) return;
    const files: EditionFile[] = [];
    const base = new URL(import.meta.env.BASE_URL, location.origin).href;
    for (const item of value) {
      if (
        !item ||
        typeof item.url !== "string" ||
        typeof item.hash !== "string" ||
        !/^[a-f0-9]{64}$/.test(item.hash) ||
        !Number.isSafeInteger(item.bytes) ||
        item.bytes < 0
      )
        return;
      const url = new URL(item.url, location.origin);
      if (!url.href.startsWith(base) || url.search || url.hash) return;
      files.push({ url: url.href, bytes: item.bytes, sha256: item.hash });
    }
    return files;
  }
  function repair(files: EditionFile[], owner: ServiceWorker): void {
    if (repairTask || !navigator.onLine || registration?.waiting || !expected) return;
    const cancellation = new AbortController();
    repairController = cancellation;
    repairOwner = owner;
    let failed = false;
    repairTask = (async () => {
      for (const [index, file] of files.entries()) {
        cancellation.signal.throwIfAborted();
        if (owner !== navigator.serviceWorker.controller || registration?.waiting)
          throw new DOMException("The edition changed", "AbortError");
        status.textContent = `Saving this edition’s offline files… ${index} of ${files.length} remaining files verified.`;
        await editionFileBytes(file, cancellation.signal, true);
      }
    })()
      .catch(() => {
        failed = true;
        if (
          !cancellation.signal.aborted &&
          owner === navigator.serviceWorker.controller &&
          !registration?.waiting
        )
          status.textContent = incomplete;
      })
      .finally(() => {
        repairTask = undefined;
        repairController = undefined;
        repairOwner = undefined;
        // Only a fresh worker inventory can establish full offline availability.
        if (!failed || owner !== navigator.serviceWorker.controller) void inspect();
      });
  }
  async function inspect(): Promise<void> {
    const id = ++request;
    closeInventory();
    const controller = navigator.serviceWorker.controller;
    if (repairOwner && repairOwner !== controller) repairController?.abort();
    if (registration?.waiting) {
      repairController?.abort();
      status.textContent = updateNotice;
      return;
    }
    if (!controller) {
      status.textContent = "Preparing this edition for offline reading…";
      return;
    }
    status.textContent = "Checking this edition’s offline files…";
    const current = new MessageChannel();
    channel = current;
    timeout = window.setTimeout(() => {
      current.port1.close();
      if (id === request)
        status.textContent =
          "Offline availability could not be confirmed. Save a notebook for a portable copy.";
    }, 12_000);
    current.port1.onmessage = (event: MessageEvent<unknown>) => {
      if (id !== request || controller !== navigator.serviceWorker.controller) return;
      const value = event.data as {
        edition?: unknown;
        complete?: unknown;
        files?: unknown;
        progress?: unknown;
        checked?: unknown;
        missing?: unknown;
      } | null;
      if (!value || value.edition !== expected) return;
      if (
        value.progress === true &&
        typeof value.checked === "number" &&
        typeof value.files === "number" &&
        Number.isInteger(value.checked) &&
        Number.isInteger(value.files) &&
        value.files > 0 &&
        value.checked >= 0 &&
        value.checked < value.files
      ) {
        status.textContent = repairTask
          ? "Saving this edition’s offline files…"
          : `Checking this edition’s offline files… ${value.checked} of ${value.files} verified.`;
        return;
      }
      closeInventory();
      if (registration?.waiting) {
        status.textContent = updateNotice;
        return;
      }
      if (value.complete === true) {
        status.textContent = "This edition is available offline, including every source page.";
        return;
      }
      status.textContent = repairTask ? "Saving this edition’s offline files…" : incomplete;
      const missing = missingFiles(value.missing);
      if (missing?.length) repair(missing, controller);
    };
    // Inventory events do no network work: long transfers belong to the page.
    controller.postMessage({ type: "inventory" }, [current.port2]);
  }
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    void inspect();
  });
  navigator.serviceWorker.addEventListener("message", (event: MessageEvent<unknown>) => {
    if (event.source !== navigator.serviceWorker.controller) return;
    const value = event.data as { type?: unknown; edition?: unknown } | null;
    if (
      (value?.type === "inventory-invalidated" || value?.type === "inventory-restored") &&
      value.edition === expected
    )
      void inspect();
  });
  window.addEventListener("horos:asset-failure", () => {
    void inspect();
  });
  window.addEventListener("horos:asset-retained", () => {
    if (!repairTask) void inspect();
  });
  window.addEventListener("online", () => {
    void inspect();
  });
  window.addEventListener("offline", () => {
    repairController?.abort();
    void inspect();
  });
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") void inspect();
  });
  void navigator.serviceWorker
    .register(`${import.meta.env.BASE_URL}sw.js`, { scope: import.meta.env.BASE_URL })
    .then((installed) => {
      registration = installed;
      const watched = new WeakSet<ServiceWorker>();
      function watch(worker: ServiceWorker | null): void {
        if (!worker || watched.has(worker)) return;
        watched.add(worker);
        worker.addEventListener("statechange", () => {
          if (worker.state === "redundant" && !navigator.serviceWorker.controller) {
            ++request;
            status.textContent =
              "Offline installation did not complete. Reconnect and reload to try again, or save a notebook.";
          } else void inspect();
        });
      }
      installed.addEventListener("updatefound", () => {
        watch(installed.installing);
      });
      watch(installed.installing);
      return inspect();
    })
    .catch(() => {
      status.textContent =
        "Offline installation did not complete. The notebook is a separate portable copy.";
    });
}
