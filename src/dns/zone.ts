import { DNS_CLASSES } from "./constants";
import type { DNSRecord } from "./record";

export interface DNSZone {
  name: string;
  records: DNSRecord[];
}

function normalizeName(name: string): string {
  return name.replace(/\.$/, "").toLowerCase();
}

export function createZone(name: string, records: DNSRecord[] = []): DNSZone {
  return {
    name: normalizeName(name),
    records: [...records],
  };
}

export function addRecord(zone: DNSZone, record: DNSRecord): void {
  zone.records.push(record);
}

export function lookupRecords(
  zone: DNSZone,
  name: string,
  type: number,
  classValue = DNS_CLASSES.IN,
): DNSRecord[] {
  const normalizedName = normalizeName(name);

  return zone.records.filter(
    (record) =>
      normalizeName(record.name) === normalizedName &&
      record.type === type &&
      record.class === classValue,
  );
}

export function nameExists(
  zone: DNSZone,
  name: string,
  classValue = DNS_CLASSES.IN,
): boolean {
  const normalizedName = normalizeName(name);

  return zone.records.some(
    (record) =>
      normalizeName(record.name) === normalizedName && record.class === classValue,
  );
}
