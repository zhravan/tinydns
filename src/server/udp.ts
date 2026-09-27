import dgram from "node:dgram";
import { DNS_CLASSES, DNS_RECORD_TYPES } from "../dns/constants";
import { decodeMessage, encodeMessage } from "../dns/message";
import { createARecord, encodeARecord } from "../dns/a-record";

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
      const question = query.questions[0];
      if (!question) return;

      const answers =
        question.name === "example.com" &&
        question.type === DNS_RECORD_TYPES.A &&
        question.class === DNS_CLASSES.IN
          ? [encodeARecord(createARecord("example.com", [127, 0, 0, 1], 300))]
          : [];

      const response = {
        header: {
          id: query.header.id,
          flags: 0x8000 | 0x0400 | (query.header.flags & 0x0100),
          questions: query.questions.length,
          answers: answers.length,
          authorities: 0,
          additionals: 0,
        },
        questions: query.questions,
        answers,
        authorities: [],
        additionals: [],
      };

      server.send(encodeMessage(response), remote.port, remote.address);
    } catch (error) {
      console.error("Failed to handle DNS query:", error);
    }
  });

  return {
    server,
    start() {
      return new Promise<void>((resolve) => server.bind(port, host, () => resolve()));
    },
    stop() {
      return new Promise<void>((resolve) => server.close(() => resolve()));
    },
  };
}
