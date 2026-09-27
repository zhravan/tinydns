import { DNS_RECORD_TYPES, DNS_CLASSES } from "./constants";
import type { DNSRecord } from "./record";

export interface ARecord {
  name: string;
  class: typeof DNS_CLASSES.IN;
  ttl: number;
  address: [number, number, number, number];
}

export function createARecord(
  name: string,
  address: [number, number, number, number],
  ttl = 300,
): ARecord {
  for (const octet of address) {
    if (octet < 0 || octet > 255 || !Number.isInteger(octet)) {
      throw new Error("IPv4 octets must be integers between 0 and 255");
    }
  }

  return {
    name,
    class: DNS_CLASSES.IN,
    ttl,
    address,
  };
}

export function encodeARecord(record: ARecord): DNSRecord {
  return {
    name: record.name,
    type: DNS_RECORD_TYPES.A,
    class: record.class,
    ttl: record.ttl,
    data: Buffer.from(record.address),
  };
}

export function decodeARecord(record: DNSRecord): ARecord {
  if (record.type !== DNS_RECORD_TYPES.A || record.data.length !== 4) {
    throw new Error("Invalid A record");
  }

  return {
    name: record.name,
    class: record.class as typeof DNS_CLASSES.IN,
    ttl: record.ttl,
    address: [
      record.data[0],
      record.data[1],
      record.data[2],
      record.data[3],
    ],
  };
}
