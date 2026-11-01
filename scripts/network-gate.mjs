// A stoppable CONNECT tunnel. Public HTTPS stays encrypted end to end; no
// application response is fulfilled by the driver. Closing the tunnel denies
// worker fetches too, unlike browser toggles that can affect only page traffic.
import { createServer } from "node:http";
import { connect } from "node:net";

export function networkGate(origin) {
  const allowed = new URL(origin);
  if (allowed.protocol !== "https:") throw new Error("The network gate expects HTTPS.");
  const authority = `${allowed.hostname}:${allowed.port || 443}`;
  let port = 0;
  let server;
  const sockets = new Set();
  return {
    get url() {
      return `http://127.0.0.1:${port}`;
    },
    async start() {
      if (server?.listening) return;
      server = createServer((_req, res) => res.writeHead(502).end());
      server.on("connection", (s) => {
        sockets.add(s);
        s.on("close", () => sockets.delete(s));
        s.on("error", () => {});
      });
      server.on("connect", (req, client, head) => {
        if (req.url !== authority) {
          client.destroy();
          return;
        }
        const upstream = connect(Number(allowed.port || 443), allowed.hostname);
        sockets.add(upstream);
        upstream.on("close", () => sockets.delete(upstream));
        upstream.on("error", () => client.destroy());
        client.on("error", () => upstream.destroy());
        client.on("close", () => upstream.destroy());
        upstream.on("connect", () => {
          if (client.destroyed) {
            upstream.destroy();
            return;
          }
          client.write("HTTP/1.1 200 Connection Established\r\n\r\n");
          if (head.length) upstream.write(head);
          client.pipe(upstream);
          upstream.pipe(client);
        });
      });
      await new Promise((accept, reject) => {
        server.once("error", reject);
        server.listen(port, "127.0.0.1", accept);
      });
      port = server.address().port;
    },
    async stop() {
      if (!server?.listening) return;
      for (const socket of sockets) socket.destroy();
      await new Promise((done) => server.close(done));
    },
  };
}
