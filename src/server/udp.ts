import dgram from "node:dgram";
import { DNS_CLASSES, DNS_RCODE, DNS_RECORD_TYPES } from "../dns/constants";
import { decodeMessage, encodeMessage } from "../dns/message";
import { createARecord, encodeARecord } from "../dns/a-record";
import { createNSRecord, encodeNSRecord } from "../dns/ns-record";
import { createSOARecord, encodeSOARecord } from "../dns/soa-record";
import { createZone, lookupRecords, nameExists, type DNSZone } from "../dns/zone";

export interface DNSServerOptions {
  host?: string;
  port?: number;
  zone?: DNSZone;
}

function createDefaultZone(): DNSZone {
  return createZone("example.com", [
    encodeARecord(createARecord("example.com", [127, 0, 0, 1], 300)),
    encodeNSRecord(createNSRecord("example.com", "ns1.example.com", 300)),
    encodeSOARecord(
      createSOARecord(
        "example.com",
        "ns1.example.com",
        "hostmaster.example.com",
        1,
        3600,
        600,
        86400,
        300,
        300,
      ),
    ),
  ]);
}

export function createDNSServer(options: DNSServerOptions = {}) {
  const host = options.host ?? "127.0.0.1";
  const port = options.port ?? 5353;
  const zone = options.zone ?? createDefaultZone();
  const server = dgram.createSocket("udp4");

  server.on("message", (packet, remote) => {
    try {
      const query = decodeMessage(packet);
      const question = query.questions[0];
      if (!question) return;

      const records = lookupRecords(zone, question.name, question.type, question.class);
      const exists = nameExists(zone, question.name, question.class);
      const rcode = exists ? DNS_RCODE.NOERROR : DNS_RCODE.NXDOMAIN;

      const response = {
        header: {
          id: query.header.id,
          flags: 0x8000 | 0x0400 | (query.header.flags & 0x0100) | rcode,
          questions: query.questions.length,
          answers: records.length,
          authorities: 0,
          additionals: 0,
        },
        questions: query.questions,
        answers: records,
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
