import { describe, expect, test } from "bun:test";
import { decodeHeader, encodeHeader, type DNSHeader } from "./header";

describe("DNS header", () => {
  test("encodes a header into the 12-byte wire format", () => {
    const header: DNSHeader = {
      id: 0x1234,
      flags: 0x0100,
      questions: 1,
      answers: 0,
      authorities: 0,
      additionals: 0,
    };

    expect(encodeHeader(header)).toEqual(
      Buffer.from([
        0x12, 0x34,
        0x01, 0x00,
        0x00, 0x01,
        0x00, 0x00,
        0x00, 0x00,
        0x00, 0x00,
      ]),
    );
  });

  test("decodes a 12-byte wire-format header", () => {
    const buffer = Buffer.from([
      0xab, 0xcd,
      0x81, 0x80,
      0x00, 0x01,
      0x00, 0x01,
      0x00, 0x00,
      0x00, 0x00,
    ]);

    expect(decodeHeader(buffer)).toEqual({
      id: 0xabcd,
      flags: 0x8180,
      questions: 1,
      answers: 1,
      authorities: 0,
      additionals: 0,
    });
  });

  test("rejects truncated headers", () => {
    expect(() => decodeHeader(Buffer.alloc(11))).toThrow(
      "DNS header must be at least 12 bytes",
    );
  });
});
