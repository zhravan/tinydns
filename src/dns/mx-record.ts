import { decodeName, encodeName } from "./name";
import { DNS_CLASSES, DNS_RECORD_TYPES } from "./constants";
import type { DNSRecord } from "./record";

export interface MXRecord {
  name: string;
  class: typeof DNS_CLASSES.IN;
  ttl: number;
  preference: number;
  exchange: string;
}

export function createMXRecord(
  name: string,
  exchange: string,
  preference = 10,
  ttl = 300,
): MXRecord {
  if (!Number.isInteger(preference) || preference < 0 || preference > 0xffff) {
    throw new Error("MX preference must be an unsigned 16-bit integer");
  }
  return { name, class: DNS_CLASSES.IN, ttl, preference, exchange };
}

export function encodeMXRecord(record: MXRecord): DNSRecord {
  const preference = Buffer.alloc(2);
  preference.writeUInt16BE(record.preference, 0);
  return {
    name: record.name,
    type: DNS_RECORD_TYPES.MX,
    class: record.class,
    ttl: record.ttl,
    data: Buffer.concat([preference, encodeName(record.exchange)]),
  };
}

export function decodeMXRecord(record: DNSRecord): MXRecord {
  if (record.type !== DNS_RECORD_TYPES.MX || record.data.length < 3) {
    throw new Error("Invalid MX record");
  }
  const exchange = decodeName(record.data, 2);
  if (exchange.offset !== record.data.length) throw new Error("Invalid MX record data");
  return {
    name: record.name,
    class: record.class as typeof DNS_CLASSES.IN,
    ttl: record.ttl,
    preference: record.data.readUInt16BE(0),
    exchange: exchange.name,
  };
}
