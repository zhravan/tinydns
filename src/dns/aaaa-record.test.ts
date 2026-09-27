import { describe, expect, test } from "bun:test";
import { DNS_CLASSES, DNS_RECORD_TYPES } from "./constants";
import { createAAAARecord, decodeAAAARecord, encodeAAAARecord } from "./aaaa-record";

describe("AAAA records", () => {
  test("encodes an IPv6 address", () => {
    const record = createAAAARecord("example.com", "2001:db8::1");
    expect(encodeAAAARecord(record)).toEqual({
      name: "example.com",
      type: DNS_RECORD_TYPES.AAAA,
      class: DNS_CLASSES.IN,
      ttl: 300,
      data: Buffer.from([
        0x20, 0x01, 0x0d, 0xb8, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 1,
      ]),
    });
  });

  test("decodes an IPv6 address", () => {
    expect(
      decodeAAAARecord({
        name: "example.com",
        type: DNS_RECORD_TYPES.AAAA,
        class: DNS_CLASSES.IN,
        ttl: 300,
        data: Buffer.from([
          0x20, 0x01, 0x0d, 0xb8, 0, 0, 0, 0,
          0, 0, 0, 0, 0, 0, 0, 1,
        ]),
      }),
    ).toEqual({
      name: "example.com",
      class: DNS_CLASSES.IN,
      ttl: 300,
      address: "2001:db8:0:0:0:0:0:1",
    });
  });
});
