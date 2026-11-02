import { readdir, readFile } from "node:fs/promises";
import { createServer } from "node:http";
import { extname, resolve, sep } from "node:path";

const types = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".jpg": "image/jpeg",
  ".woff2": "font/woff2",
  ".svg": "image/svg+xml",
  ".txt": "text/plain",
};

/** One actual shared payload budget, including page and service-worker traffic. */
export function transferServer(root, bytesPerSecond = 128_000) {
  const directory = resolve(root);
  const payloads = new Map();
  const queue = [];
  const requests = [];
  let server;
  let tick;
  let port = 0;
  let online = true;
  let mode = "slow";
  let target = "";
  let sent = 0;
  return {
    requests,
    get sent() {
      return sent;
    },
    get base() {
      return `http://127.0.0.1:${port}/horos/`;
    },
    set online(value) {
      online = value;
    },
    configure(nextMode, nextTarget = "") {
      mode = nextMode;
      target = nextTarget;
    },
    async start() {
      async function retain(dir) {
        for (const entry of await readdir(dir, { withFileTypes: true })) {
          const file = resolve(dir, entry.name);
          if (entry.isDirectory()) await retain(file);
          else payloads.set(file, await readFile(file));
        }
      }
      // Freeze the artifact once: a later local build cannot change a long run.
      await retain(directory);
      server = createServer(async (req, res) => {
        if (!online) {
          req.socket.destroy();
          return;
        }
        try {
          const pathname = new URL(req.url, "http://review").pathname;
          if (!pathname.startsWith("/horos/")) {
            res.writeHead(404).end();
            return;
          }
          const file = resolve(directory, decodeURIComponent(pathname.slice(7)) || "index.html");
          if (!file.startsWith(directory + sep)) {
            res.writeHead(404).end();
            return;
          }
          const bytes = payloads.get(file);
          if (!bytes) {
            res.writeHead(404).end();
            return;
          }
          const record = {
            path: pathname,
            mode,
            at: Date.now(),
            bytes: bytes.length,
            sent: 0,
            closedAt: null,
            lastByteAt: null,
            maxGapMs: 0,
          };
          requests.push(record);
          res.on("close", () => {
            record.closedAt = Date.now();
          });
          const selected = target && pathname.endsWith(target);
          if (mode === "headers" && selected) return;
          res.writeHead(200, {
            "Content-Type": types[extname(file)] || "application/octet-stream",
            "Cache-Control": "no-store",
          });
          res.flushHeaders();
          if (mode === "drip" && selected) {
            res.write(bytes.subarray(0, 4096));
            record.sent = 4096;
            record.lastByteAt = Date.now();
            const drip = setInterval(() => {
              res.write(bytes.subarray(0, 1));
              const now = Date.now();
              record.maxGapMs = Math.max(record.maxGapMs, now - record.lastByteAt);
              record.lastByteAt = now;
              record.sent++;
            }, 1000);
            res.on("close", () => clearInterval(drip));
            return;
          }
          if (mode === "stall" && selected) {
            res.write(bytes.subarray(0, 4096));
            record.sent = 4096;
            record.lastByteAt = Date.now();
            return;
          }
          if (mode === "oversized" && selected) {
            res.end(Buffer.concat([bytes, Buffer.alloc(65536)]));
            record.sent = bytes.length + 65536;
            return;
          }
          if (mode === "truncated" && selected) {
            res.end(bytes.subarray(0, bytes.length - 1));
            record.sent = bytes.length - 1;
            return;
          }
          if (mode !== "slow") {
            res.end(bytes);
            record.sent = bytes.length;
            return;
          }
          queue.push({ res, bytes, at: 0, record });
        } catch {
          res.writeHead(404).end();
        }
      });
      // Round robin: a 4096-byte packet per tick, shared across all response bodies.
      tick = setInterval(
        () => {
          while (queue.length && queue[0].res.destroyed) queue.shift();
          const job = queue.shift();
          if (!job) return;
          const end = Math.min(job.at + 4096, job.bytes.length);
          job.res.write(job.bytes.subarray(job.at, end));
          const now = Date.now();
          if (job.record.lastByteAt)
            job.record.maxGapMs = Math.max(job.record.maxGapMs, now - job.record.lastByteAt);
          job.record.lastByteAt = now;
          job.record.sent += end - job.at;
          sent += end - job.at;
          job.at = end;
          if (end === job.bytes.length) job.res.end();
          else queue.push(job);
        },
        (4096 / bytesPerSecond) * 1000,
      );
      await new Promise((done, reject) => {
        server.once("error", reject);
        server.listen(port, "127.0.0.1", done);
      });
      port = server.address().port;
    },
    async stop() {
      clearInterval(tick);
      if (!server?.listening) return;
      server.closeAllConnections();
      await new Promise((done) => server.close(done));
    },
  };
}
