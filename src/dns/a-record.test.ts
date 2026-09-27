import { describe, expect, test } from "bun:test";
import { DNS_CLASSES, DNS_RECORD_TYPES } from "./constants";
import { createARecord, decodeARecord, encodeARecord } from "./a-record";

describe("A records", () => {
  test("creates an IPv4 A record", () => {
    expect(createARecord("example.com", [127, 0, 0, 1], 300)).toEqual({
      name: "example.com",
      class: DNS_CLASSES.IN,
      ttl: 300,
      address: [127, 0, 0, 1],
    });
  });

  test("encodes an A record", () => {
    expect(
      encodeARecord(createARecord("example.com", [127, 0, 0, 1])),
    ).toEqual({
      name: "example.com",
      type: DNS_RECORD_TYPES.A,
      class: DNS_CLASSES.IN,
      ttl: 300,
      data: Buffer.from([127, 0, 0, 1]),
    });
  });

  test("decodes an A record", () => {
    expect(
      decodeARecord({
        name: "example.com",
        type: DNS_RECORD_TYPES.A,
        class: DNS_CLASSES.IN,
        ttl: 300,
        data: Buffer.from([127, 0, 0, 1]),
      }),
    ).toEqual({
      name: "example.com",
      class: DNS_CLASSES.IN,
      ttl: 300,
      address: [127, 0, 0, 1],
    });
  });

  test("rejects invalid IPv4 octets", () => {
    expect(() => createARecord("example.com", [127, 0, 0, 256])).toThrow(
      "IPv4 octets must be integers between 0 and 255",
    );
  });
});
