import { describe, expect, test } from "bun:test";
import { decodeName, encodeName } from "./name";

describe("DNS names", () => {
  test("encodes a domain name as DNS labels", () => {
    expect(encodeName("example.com")).toEqual(
      Buffer.from([
        0x07, ...Buffer.from("example"),
        0x03, ...Buffer.from("com"),
        0x00,
      ]),
    );
  });

  test("accepts a trailing root dot", () => {
    expect(encodeName("example.com.")).toEqual(encodeName("example.com"));
  });

  test("encodes the root name", () => {
    expect(encodeName(".")).toEqual(Buffer.from([0]));
  });

  test("rejects labels longer than 63 bytes", () => {
    expect(() => encodeName("a".repeat(64) + ".com")).toThrow(
      "DNS label must be at most 63 bytes",
    );
  });

  test("decodes a DNS name", () => {
    const buffer = encodeName("example.com");

    expect(decodeName(buffer)).toEqual({
      name: "example.com",
      offset: buffer.length,
    });
  });

  test("rejects unsupported compression pointers for now", () => {
    expect(() => decodeName(Buffer.from([0xc0, 0x0c]))).toThrow(
      "DNS name compression is not implemented yet",
    );
  });
});
