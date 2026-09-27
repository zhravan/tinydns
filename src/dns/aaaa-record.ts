import { DNS_CLASSES, DNS_RECORD_TYPES } from "./constants";
import type { DNSRecord } from "./record";

export interface AAAARecord {
  name: string;
  class: typeof DNS_CLASSES.IN;
  ttl: number;
  address: string;
}

function parseIPv6(address: string): Buffer {
  const parts = address.split("::");
  if (parts.length > 2) throw new Error("Invalid IPv6 address");

  const left = parts[0] ? parts[0].split(":").filter(Boolean) : [];
  const right = parts[1] ? parts[1].split(":").filter(Boolean) : [];

  if (left.length + right.length > 8) throw new Error("Invalid IPv6 address");

  const groups = [
    ...left,
    ...Array(8 - left.length - right.length).fill("0"),
    ...right,
  ];

  if (groups.length !== 8 || groups.some((group) => !/^[0-9a-fA-F]{1,4}$/.test(group))) {
    throw new Error("Invalid IPv6 address");
  }

  const buffer = Buffer.alloc(16);
  groups.forEach((group, index) => buffer.writeUInt16BE(parseInt(group, 16), index * 2));
  return buffer;
}

function formatIPv6(buffer: Buffer): string {
  const groups = Array.from({ length: 8 }, (_, index) =>
    buffer.readUInt16BE(index * 2).toString(16),
  );
  return groups.join(":");
}

export function createAAAARecord(name: string, address: string, ttl = 300): AAAARecord {
  parseIPv6(address);
  return { name, class: DNS_CLASSES.IN, ttl, address };
}

export function encodeAAAARecord(record: AAAARecord): DNSRecord {
  return {
    name: record.name,
    type: DNS_RECORD_TYPES.AAAA,
    class: record.class,
    ttl: record.ttl,
    data: parseIPv6(record.address),
  };
}

export function decodeAAAARecord(record: DNSRecord): AAAARecord {
  if (record.type !== DNS_RECORD_TYPES.AAAA || record.data.length !== 16) {
    throw new Error("Invalid AAAA record");
  }

  return {
    name: record.name,
    class: record.class as typeof DNS_CLASSES.IN,
    ttl: record.ttl,
    address: formatIPv6(record.data),
  };
}
