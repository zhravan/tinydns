import { describe, expect, test } from "bun:test";
import { DNS_CLASSES, DNS_RECORD_TYPES } from "./constants";
import { createCNAMERecord, decodeCNAMERecord, encodeCNAMERecord } from "./cname-record";

describe("CNAME records", () => {
  test("encodes a CNAME target", () => {
    expect(
      encodeCNAMERecord(createCNAMERecord("www.example.com", "example.com")),
    ).toEqual({
      name: "www.example.com",
      type: DNS_RECORD_TYPES.CNAME,
      class: DNS_CLASSES.IN,
      ttl: 300,
      data: Buffer.from([
        0x07, ...Buffer.from("example"),
        0x03, ...Buffer.from("com"),
        0x00,
      ]),
    });
  });

  test("decodes a CNAME target", () => {
    expect(
      decodeCNAMERecord({
        name: "www.example.com",
        type: DNS_RECORD_TYPES.CNAME,
        class: DNS_CLASSES.IN,
        ttl: 300,
        data: Buffer.from([
          0x07, ...Buffer.from("example"),
          0x03, ...Buffer.from("com"),
          0x00,
        ]),
      }),
    ).toEqual({
      name: "www.example.com",
      class: DNS_CLASSES.IN,
      ttl: 300,
      target: "example.com",
    });
  });
});
