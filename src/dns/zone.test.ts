import { describe, expect, test } from "bun:test";
import { createARecord, encodeARecord } from "./a-record";
import { DNS_RECORD_TYPES } from "./constants";
import { createZone, lookupRecords, nameExists } from "./zone";

describe("DNS zones", () => {
  const zone = createZone("example.com", [
    encodeARecord(createARecord("example.com", [127, 0, 0, 1])),
  ]);

  test("looks up records case-insensitively", () => {
    expect(lookupRecords(zone, "Example.COM", DNS_RECORD_TYPES.A)).toHaveLength(1);
  });

  test("detects existing names independently of record type", () => {
    expect(nameExists(zone, "example.com")).toBe(true);
    expect(nameExists(zone, "missing.example.com")).toBe(false);
  });
});
