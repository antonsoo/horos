export interface TransferIdentity {
  bytes: number;
  sha256: string;
}

/** Self-contained so the worker builder can embed this exact runtime too. */
export function verifiedTransferRuntime() {
  const totalLimit = 180_000;
  const idleLimit = 15_000;
  function error(name: string, message: string): Error {
    const result = new Error(message);
    result.name = name;
    return result;
  }
  function scope(signal?: AbortSignal) {
    const controller = new AbortController();
    const cancel = () => controller.abort(signal?.reason);
    if (signal?.aborted) cancel();
    else signal?.addEventListener("abort", cancel, { once: true });
    const deadline = setTimeout(
      () =>
        controller.abort(
          error("TransferTimeoutError", "The file exceeded the three-minute transfer limit"),
        ),
      totalLimit,
    );
    return {
      controller,
      close() {
        clearTimeout(deadline);
        signal?.removeEventListener("abort", cancel);
      },
    };
  }
  async function read(
    response: Response,
    identity: TransferIdentity,
    controller: AbortController,
  ): Promise<Uint8Array<ArrayBuffer>> {
    controller.signal.throwIfAborted();
    if (!response.ok) {
      void response.body?.cancel().catch(() => {});
      throw error("TransferHttpError", `Could not load the file (HTTP ${response.status})`);
    }
    if (!response.body)
      throw error(
        "TransferIntegrityError",
        "The downloaded file does not match this edition (no body)",
      );
    const reader = response.body.getReader();
    const buffer = new Uint8Array(identity.bytes);
    let length = 0;
    let completed = false;
    let idle: ReturnType<typeof setTimeout> | undefined;
    const progress = () => {
      clearTimeout(idle);
      idle = setTimeout(
        () =>
          controller.abort(
            error("TransferTimeoutError", "The file stopped making progress for fifteen seconds"),
          ),
        idleLimit,
      );
    };
    const cancel = () => {
      void reader.cancel(controller.signal.reason).catch(() => {});
    };
    controller.signal.addEventListener("abort", cancel, { once: true });
    try {
      progress();
      for (;;) {
        const { done, value } = await reader.read();
        controller.signal.throwIfAborted();
        if (done) {
          completed = true;
          break;
        }
        if (!value.byteLength) continue;
        progress();
        if (length + value.byteLength > buffer.length)
          throw error(
            "TransferIntegrityError",
            "The downloaded file does not match this edition (too many bytes)",
          );
        buffer.set(value, length);
        length += value.byteLength;
      }
      clearTimeout(idle);
      if (length !== buffer.length)
        throw error(
          "TransferIntegrityError",
          "The downloaded file does not match this edition (wrong length)",
        );
      const hash = Array.from(
        new Uint8Array(await crypto.subtle.digest("SHA-256", buffer)),
        (byte) => byte.toString(16).padStart(2, "0"),
      ).join("");
      controller.signal.throwIfAborted();
      if (hash !== identity.sha256)
        throw error(
          "TransferIntegrityError",
          "The downloaded file failed its source check. No substituted file will be used",
        );
      return buffer;
    } finally {
      clearTimeout(idle);
      controller.signal.removeEventListener("abort", cancel);
      if (!completed) void reader.cancel().catch(() => {});
      reader.releaseLock();
    }
  }
  async function readBytes(response: Response, identity: TransferIdentity, signal?: AbortSignal) {
    const request = scope(signal);
    try {
      return await read(response, identity, request.controller);
    } catch (caught) {
      if (request.controller.signal.aborted) throw request.controller.signal.reason;
      throw caught;
    } finally {
      request.close();
    }
  }
  async function fetchBytes(
    url: string,
    identity: TransferIdentity,
    signal?: AbortSignal,
    headerLimit = 60_000,
    cache: RequestCache = "no-store",
  ) {
    const request = scope(signal);
    const { controller } = request;
    const headers = setTimeout(
      () =>
        controller.abort(
          error("TransferTimeoutError", "The server did not begin sending the file in time"),
        ),
      headerLimit,
    );
    try {
      controller.signal.throwIfAborted();
      let response: Response;
      try {
        response = await fetch(url, {
          signal: controller.signal,
          cache,
          headers: { "X-Horos-Transfer": "verified" },
        });
      } catch (caught) {
        controller.signal.throwIfAborted();
        throw error(
          "TransferNetworkError",
          `Could not load the file: ${caught instanceof Error ? caught.message : "the source could not be reached"}`,
        );
      }
      clearTimeout(headers);
      return { bytes: await read(response, identity, controller), response };
    } catch (caught) {
      if (controller.signal.aborted) throw controller.signal.reason;
      throw caught;
    } finally {
      clearTimeout(headers);
      request.close();
    }
  }
  return { fetchBytes, readBytes };
}
