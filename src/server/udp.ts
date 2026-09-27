import dgram from "node:dgram";
import { decodeMessage, encodeMessage } from "../dns/message";

export interface DNSServerOptions {
  host?: string;
  port?: number;
}

export function createDNSServer(options: DNSServerOptions = {}) {
  const host = options.host ?? "127.0.0.1";
  const port = options.port ?? 5353;

  const server = dgram.createSocket("udp4");

  server.on("message", (packet, remote) => {
    try {
      const query = decodeMessage(packet);

      if (query.header.questions === 0) {
        return;
      }

      const response = {
        header: {
          id: query.header.id,
          // QR=1 (response), RD copied from query.
          flags: 0x8000 | (query.header.flags & 0x0100),
          questions: query.questions.length,
          answers: 0,
          authorities: 0,
          additionals: 0,
        },
        questions: query.questions,
      };

      const encoded = encodeMessage(response);
      server.send(encoded, remote.port, remote.address);
    } catch (error) {
      console.error("Failed to handle DNS query:", error);
    }
  });

  return {
    server,
    start() {
      return new Promise<void>((resolve) => {
        server.bind(port, host, () => {
          resolve();
        });
      });
    },
    stop() {
      return new Promise<void>((resolve) => {
        server.close(() => resolve());
      });
    },
  };
}
