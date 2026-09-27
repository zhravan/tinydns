import { describe, expect, test } from "bun:test";
import { createNSRecord, decodeNSRecord, encodeNSRecord } from "./ns-record";

describe("NS records", () => {
  test("encodes and decodes a nameserver", () => {
    const record = createNSRecord("example.com", "ns1.example.com", 3600);

    expect(decodeNSRecord(encodeNSRecord(record))).toEqual(record);
  });

  test("rejects trailing data", () => {
    const record = encodeNSRecord(createNSRecord("example.com", "ns1.example.com"));
    record.data = Buffer.concat([record.data, Buffer.from([0])]);

    expect(() => decodeNSRecord(record)).toThrow("Trailing data in NS record");
  });
});
