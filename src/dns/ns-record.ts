import { decodeName, encodeName } from "./name";
import { DNS_CLASSES, DNS_RECORD_TYPES } from "./constants";
import type { DNSRecord } from "./record";

export interface NSRecord {
  name: string;
  class: typeof DNS_CLASSES.IN;
  ttl: number;
  host: string;
}

export function createNSRecord(name: string, host: string, ttl = 300): NSRecord {
  return { name, class: DNS_CLASSES.IN, ttl, host };
}

export function encodeNSRecord(record: NSRecord): DNSRecord {
  return {
    name: record.name,
    type: DNS_RECORD_TYPES.NS,
    class: record.class,
    ttl: record.ttl,
    data: encodeName(record.host),
  };
}

export function decodeNSRecord(record: DNSRecord): NSRecord {
  if (record.type !== DNS_RECORD_TYPES.NS) throw new Error("Invalid NS record");

  const decoded = decodeName(record.data);

  if (decoded.offset !== record.data.length) {
    throw new Error("Trailing data in NS record");
  }

  return {
    name: record.name,
    class: record.class as typeof DNS_CLASSES.IN,
    ttl: record.ttl,
    host: decoded.name,
  };
}
