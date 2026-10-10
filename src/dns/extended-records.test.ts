import { describe, expect, test } from "bun:test";
import { createAAAARecord, decodeAAAARecord, encodeAAAARecord } from "./aaaa-record";
import { createMXRecord, decodeMXRecord, encodeMXRecord } from "./mx-record";
import { createPTRRecord, decodePTRRecord, encodePTRRecord } from "./ptr-record";
import { createTXTRecord, decodeTXTRecord, encodeTXTRecord } from "./txt-record";

describe("extended DNS record types", () => {
  test("round-trips AAAA records", () => {
    const record = createAAAARecord("v6.example.com", "2001:db8::1", 120);
    expect(decodeAAAARecord(encodeAAAARecord(record))).toEqual({
      ...record,
      address: "2001:db8:0:0:0:0:0:1",
    });
  });

  test("round-trips MX records", () => {
    const record = createMXRecord("example.com", "mail.example.com", 20, 600);
    expect(decodeMXRecord(encodeMXRecord(record))).toEqual(record);
  });

  test("round-trips PTR records", () => {
    const record = createPTRRecord("1.2.0.192.in-addr.arpa", "host.example.com", 60);
    expect(decodePTRRecord(encodePTRRecord(record))).toEqual(record);
  });

  test("round-trips multiple TXT strings", () => {
    const record = createTXTRecord("example.com", ["v=spf1", "include:mail.example.com"], 300);
    expect(decodeTXTRecord(encodeTXTRecord(record))).toEqual(record);
  });

  test("rejects TXT strings longer than 255 bytes", () => {
    expect(() => createTXTRecord("example.com", "x".repeat(256))).toThrow(
      "Each TXT string must be at most 255 bytes",
    );
  });
});
