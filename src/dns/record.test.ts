import { describe, expect, test } from "bun:test";
import { decodeRecord, encodeRecord } from "./record";

describe("DNS records", () => {
  test("encodes and decodes a generic resource record", () => {
    const record = {
      name: "example.com",
      type: 1,
      class: 1,
      ttl: 300,
      data: Buffer.from([127, 0, 0, 1]),
    };

    const encoded = encodeRecord(record);

    expect(decodeRecord(encoded)).toEqual({
      record,
      offset: encoded.length,
    });
  });

  test("rejects truncated record headers", () => {
    expect(() => decodeRecord(Buffer.alloc(12))).toThrow(
      "DNS record header is truncated",
    );
  });

  test("rejects truncated record data", () => {
    const encoded = Buffer.concat([
      Buffer.from([0]),
      Buffer.from([0, 1, 0, 1, 0, 0, 1, 0x2c, 0, 4]),
      Buffer.from([127, 0]),
    ]);

    expect(() => decodeRecord(encoded)).toThrow(
      "DNS record data is truncated",
    );
  });
});
