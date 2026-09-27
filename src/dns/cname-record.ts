import { decodeName, encodeName } from "./name";
import { DNS_CLASSES, DNS_RECORD_TYPES } from "./constants";
import type { DNSRecord } from "./record";

export interface CNAMERecord {
  name: string;
  class: typeof DNS_CLASSES.IN;
  ttl: number;
  target: string;
}

export function createCNAMERecord(name: string, target: string, ttl = 300): CNAMERecord {
  return { name, class: DNS_CLASSES.IN, ttl, target };
}

export function encodeCNAMERecord(record: CNAMERecord): DNSRecord {
  return {
    name: record.name,
    type: DNS_RECORD_TYPES.CNAME,
    class: record.class,
    ttl: record.ttl,
    data: encodeName(record.target),
  };
}

export function decodeCNAMERecord(record: DNSRecord): CNAMERecord {
  if (record.type !== DNS_RECORD_TYPES.CNAME) throw new Error("Invalid CNAME record");

  const decoded = decodeName(record.data);

  if (decoded.offset !== record.data.length) {
    throw new Error("Trailing data in CNAME record");
  }

  return {
    name: record.name,
    class: record.class as typeof DNS_CLASSES.IN,
    ttl: record.ttl,
    target: decoded.name,
  };
}
