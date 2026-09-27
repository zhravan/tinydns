import { describe, expect, test } from "bun:test";
import dgram from "node:dgram";
import { DNS_RCODE, DNS_RECORD_TYPES } from "../dns/constants";
import { encodeMessage, decodeMessage } from "../dns/message";
import { createDNSServer } from "./udp";

async function queryServer(port: number, name: string, type: number): Promise<Buffer> {
  const client = dgram.createSocket("udp4");

  try {
    return await new Promise<Buffer>((resolve, reject) => {
      client.once("message", (message) => resolve(message));
      client.once("error", reject);

      const query = encodeMessage({
        header: {
          id: 0x1234,
          flags: 0x0100,
          questions: 1,
          answers: 0,
          authorities: 0,
          additionals: 0,
        },
        questions: [{ name, type, class: 1 }],
        answers: [],
        authorities: [],
        additionals: [],
      });

      client.send(query, port, "127.0.0.1");
    });
  } finally {
    client.close();
  }
}

describe("UDP DNS server", () => {
  test("returns an authoritative A answer", async () => {
    const server = createDNSServer({ port: 15353 });
    await server.start();

    const response = await queryServer(15353, "example.com", DNS_RECORD_TYPES.A);
    const message = decodeMessage(response);

    expect(message.header.id).toBe(0x1234);
    expect(message.header.flags & 0x8000).toBe(0x8000);
    expect(message.header.flags & 0x0400).toBe(0x0400);
    expect(message.header.flags & 0x000f).toBe(DNS_RCODE.NOERROR);
    expect(message.answers).toHaveLength(1);
    expect(message.answers[0]?.data).toEqual(Buffer.from([127, 0, 0, 1]));

    await server.stop();
  });

  test("returns NXDOMAIN for an unknown name", async () => {
    const server = createDNSServer({ port: 15354 });
    await server.start();

    const response = await queryServer(15354, "missing.example.com", DNS_RECORD_TYPES.A);
    const message = decodeMessage(response);

    expect(message.header.flags & 0x000f).toBe(DNS_RCODE.NXDOMAIN);
    expect(message.answers).toHaveLength(0);

    await server.stop();
  });

  test("returns other authoritative record types", async () => {
    const server = createDNSServer({ port: 15355 });
    await server.start();

    const nsResponse = decodeMessage(
      await queryServer(15355, "example.com", DNS_RECORD_TYPES.NS),
    );
    const soaResponse = decodeMessage(
      await queryServer(15355, "example.com", DNS_RECORD_TYPES.SOA),
    );

    expect(nsResponse.answers[0]?.type).toBe(DNS_RECORD_TYPES.NS);
    expect(soaResponse.answers[0]?.type).toBe(DNS_RECORD_TYPES.SOA);

    await server.stop();
  });
});
