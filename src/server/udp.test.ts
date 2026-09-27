import { describe, expect, test } from "bun:test";
import dgram from "node:dgram";
import { createDNSServer } from "./udp";

describe("UDP DNS server", () => {
  test("returns a DNS response for a query", async () => {
    const server = createDNSServer({ port: 15353 });
    await server.start();

    const client = dgram.createSocket("udp4");

    const response = await new Promise<Buffer>((resolve, reject) => {
      client.once("message", (message) => resolve(message));
      client.once("error", reject);

      const query = Buffer.from([
        0x12, 0x34,
        0x01, 0x00,
        0x00, 0x01,
        0x00, 0x00,
        0x00, 0x00,
        0x00, 0x00,
        0x07, ...Buffer.from("example"),
        0x03, ...Buffer.from("com"),
        0x00,
        0x00, 0x01,
        0x00, 0x01,
      ]);

      client.send(query, 15353, "127.0.0.1");
    });

    expect(response.subarray(0, 2)).toEqual(Buffer.from([0x12, 0x34]));
    expect(response.readUInt16BE(2) & 0x8000).toBe(0x8000);
    expect(response.readUInt16BE(4)).toBe(1);
    expect(response.readUInt16BE(6)).toBe(0);

    client.close();
    await server.stop();
  });
});
