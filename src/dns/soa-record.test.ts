import { describe, expect, test } from "bun:test";
import { createSOARecord, decodeSOARecord, encodeSOARecord } from "./soa-record";

describe("SOA records", () => {
  test("encodes and decodes SOA fields", () => {
    const record = createSOARecord(
      "example.com",
      "ns1.example.com",
      "hostmaster.example.com",
      2026092701,
      3600,
      600,
      86400,
      300,
      300,
    );

    expect(decodeSOARecord(encodeSOARecord(record))).toEqual(record);
  });
});
