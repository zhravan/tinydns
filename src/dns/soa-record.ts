import { decodeName, encodeName } from "./name";
import { DNS_CLASSES, DNS_RECORD_TYPES } from "./constants";
import type { DNSRecord } from "./record";

export interface SOARecord {
  name: string;
  class: typeof DNS_CLASSES.IN;
  ttl: number;
  primary: string;
  responsible: string;
  serial: number;
  refresh: number;
  retry: number;
  expire: number;
  minimum: number;
}

export function createSOARecord(
  name: string,
  primary: string,
  responsible: string,
  serial: number,
  refresh: number,
  retry: number,
  expire: number,
  minimum: number,
  ttl = 300,
): SOARecord {
  return {
    name,
    class: DNS_CLASSES.IN,
    ttl,
    primary,
    responsible,
    serial,
    refresh,
    retry,
    expire,
    minimum,
  };
}

export function encodeSOARecord(record: SOARecord): DNSRecord {
  const data = Buffer.alloc(20);

  const rdata = Buffer.concat([
    encodeName(record.primary),
    encodeName(record.responsible),
    data,
  ]);

  rdata.writeUInt32BE(record.serial >>> 0, rdata.length - 20);
  rdata.writeUInt32BE(record.refresh >>> 0, rdata.length - 16);
  rdata.writeUInt32BE(record.retry >>> 0, rdata.length - 12);
  rdata.writeUInt32BE(record.expire >>> 0, rdata.length - 8);
  rdata.writeUInt32BE(record.minimum >>> 0, rdata.length - 4);

  return {
    name: record.name,
    type: DNS_RECORD_TYPES.SOA,
    class: record.class,
    ttl: record.ttl,
    data: rdata,
  };
}

export function decodeSOARecord(record: DNSRecord): SOARecord {
  if (record.type !== DNS_RECORD_TYPES.SOA) throw new Error("Invalid SOA record");

  const primary = decodeName(record.data, 0);
  const responsible = decodeName(record.data, primary.offset);

  if (responsible.offset + 20 !== record.data.length) {
    throw new Error("Invalid SOA record data");
  }

  return {
    name: record.name,
    class: record.class as typeof DNS_CLASSES.IN,
    ttl: record.ttl,
    primary: primary.name,
    responsible: responsible.name,
    serial: record.data.readUInt32BE(responsible.offset),
    refresh: record.data.readUInt32BE(responsible.offset + 4),
    retry: record.data.readUInt32BE(responsible.offset + 8),
    expire: record.data.readUInt32BE(responsible.offset + 12),
    minimum: record.data.readUInt32BE(responsible.offset + 16),
  };
}
