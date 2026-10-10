import { decodeName, encodeName } from "./name";
import { DNS_CLASSES, DNS_RECORD_TYPES } from "./constants";
import type { DNSRecord } from "./record";

export interface PTRRecord {
  name: string;
  class: typeof DNS_CLASSES.IN;
  ttl: number;
  target: string;
}

export function createPTRRecord(name: string, target: string, ttl = 300): PTRRecord {
  return { name, class: DNS_CLASSES.IN, ttl, target };
}

export function encodePTRRecord(record: PTRRecord): DNSRecord {
  return {
    name: record.name,
    type: DNS_RECORD_TYPES.PTR,
    class: record.class,
    ttl: record.ttl,
    data: encodeName(record.target),
  };
}

export function decodePTRRecord(record: DNSRecord): PTRRecord {
  if (record.type !== DNS_RECORD_TYPES.PTR) throw new Error("Invalid PTR record");
  const decoded = decodeName(record.data);
  if (decoded.offset !== record.data.length) throw new Error("Invalid PTR record data");
  return {
    name: record.name,
    class: record.class as typeof DNS_CLASSES.IN,
    ttl: record.ttl,
    target: decoded.name,
  };
}
