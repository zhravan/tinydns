import { isIPv6 } from "node:net";
import { DNS_CLASSES, DNS_RECORD_TYPES } from "./constants";
import type { DNSRecord } from "./record";

export interface AAAARecord {
  name: string;
  class: typeof DNS_CLASSES.IN;
  ttl: number;
  address: string;
}

function parseIPv6(address: string): Buffer {
  if (!isIPv6(address)) throw new Error("Invalid IPv6 address");

  let normalized = address.toLowerCase();
  if (normalized.includes(".")) {
    const lastColon = normalized.lastIndexOf(":");
    const ipv4 = normalized.slice(lastColon + 1).split(".").map(Number);
    if (
      ipv4.length !== 4 ||
      ipv4.some((octet) => !Number.isInteger(octet) || octet < 0 || octet > 255)
    ) {
      throw new Error("Invalid IPv6 address");
    }
    const high = ((ipv4[0]! << 8) | ipv4[1]!).toString(16);
    const low = ((ipv4[2]! << 8) | ipv4[3]!).toString(16);
    normalized = `${normalized.slice(0, lastColon + 1)}${high}:${low}`;
  }

  const parts = normalized.split("::");
  if (parts.length > 2) throw new Error("Invalid IPv6 address");
  const left = parts[0] ? parts[0].split(":") : [];
  const right = parts.length === 2 && parts[1] ? parts[1].split(":") : [];
  const missing = 8 - left.length - right.length;

  if (parts.length === 2 && missing < 1) throw new Error("Invalid IPv6 address");
  if (parts.length === 1 && missing !== 0) throw new Error("Invalid IPv6 address");

  const groups = [
    ...left,
    ...Array(parts.length === 2 ? missing : 0).fill("0"),
    ...right,
  ];
  if (groups.length !== 8 || groups.some((group) => !/^[0-9a-f]{1,4}$/.test(group))) {
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
