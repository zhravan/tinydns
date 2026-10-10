import { DNS_CLASSES, DNS_RECORD_TYPES } from "./constants";
import type { DNSRecord } from "./record";

export interface TXTRecord {
  name: string;
  class: typeof DNS_CLASSES.IN;
  ttl: number;
  texts: string[];
}

export function createTXTRecord(name: string, texts: string | string[], ttl = 300): TXTRecord {
  const values = Array.isArray(texts) ? texts : [texts];
  if (values.length === 0) throw new Error("TXT records must contain at least one string");
  for (const value of values) {
    if (Buffer.byteLength(value, "utf8") > 255) {
      throw new Error("Each TXT string must be at most 255 bytes");
    }
  }
  return { name, class: DNS_CLASSES.IN, ttl, texts: [...values] };
}

export function encodeTXTRecord(record: TXTRecord): DNSRecord {
  const data = Buffer.concat(record.texts.map((text) => {
    const bytes = Buffer.from(text, "utf8");
    return Buffer.concat([Buffer.from([bytes.length]), bytes]);
  }));
  return {
    name: record.name,
    type: DNS_RECORD_TYPES.TXT,
    class: record.class,
    ttl: record.ttl,
    data,
  };
}

export function decodeTXTRecord(record: DNSRecord): TXTRecord {
  if (record.type !== DNS_RECORD_TYPES.TXT) throw new Error("Invalid TXT record");
  const texts: string[] = [];
  let offset = 0;
  while (offset < record.data.length) {
    const length = record.data[offset]!;
    offset += 1;
    if (offset + length > record.data.length) throw new Error("Truncated TXT string");
    texts.push(record.data.subarray(offset, offset + length).toString("utf8"));
    offset += length;
  }
  if (texts.length === 0) throw new Error("Invalid TXT record data");
  return {
    name: record.name,
    class: record.class as typeof DNS_CLASSES.IN,
    ttl: record.ttl,
    texts,
  };
}
