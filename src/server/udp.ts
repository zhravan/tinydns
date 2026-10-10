import dgram from "node:dgram";
import { DNS_RCODE } from "../dns/constants";
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

function sendFormatError(packet: Buffer, remote: dgram.RemoteInfo, server: dgram.Socket): void {
  if (packet.length < 12) return;
  const id = packet.readUInt16BE(0);
  const queryFlags = packet.readUInt16BE(2);
  const response = {
    header: {
      id,
      flags: 0x8000 | (queryFlags & 0x0100) | DNS_RCODE.FORMERR,
      questions: 0,
      answers: 0,
      authorities: 0,
      additionals: 0,
    },
    questions: [],
    answers: [],
    authorities: [],
    additionals: [],
  };
  server.send(encodeMessage(response), remote.port, remote.address);
}

export function createDNSServer(options: DNSServerOptions = {}) {
  const host = options.host ?? "127.0.0.1";
  const port = options.port ?? 5353;
  if (!Number.isInteger(port) || port < 0 || port > 65535) {
    throw new Error("DNS server port must be an integer between 0 and 65535");
  }
  const zone = options.zone ?? createDefaultZone();
  const server = dgram.createSocket("udp4");

  server.on("message", (packet, remote) => {
    try {
      const query = decodeMessage(packet);
      if ((query.header.flags & 0x8000) !== 0) {
        sendFormatError(packet, remote, server);
        return;
      }
      if (query.questions.length !== 1) {
        sendFormatError(packet, remote, server);
        return;
      }

      const question = query.questions[0]!;
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
    } catch {
      sendFormatError(packet, remote, server);
    }
  });

  return {
    server,
    start() {
      return new Promise<void>((resolve, reject) => {
        const onError = (error: Error) => {
          server.off("listening", onListening);
          reject(error);
        };
        const onListening = () => {
          server.off("error", onError);
          resolve();
        };
        server.once("error", onError);
        server.once("listening", onListening);
        server.bind(port, host);
      });
    },
    stop() {
      return new Promise<void>((resolve, reject) =>
        server.close((error) => error ? reject(error) : resolve()),
      );
    },
  };
}
