import { DNS_RECORD_TYPES } from "./constants";
import { decodeName, encodeName } from "./name";

export interface DNSRecord {
  name: string;
  type: number;
  class: number;
  ttl: number;
  data: Buffer;
}

export function encodeRecord(record: DNSRecord): Buffer {
  if (record.data.length > 0xffff) throw new Error("DNS record data exceeds 65535 bytes");
  const name = encodeName(record.name);
  const header = Buffer.alloc(10);
  header.writeUInt16BE(record.type, 0);
  header.writeUInt16BE(record.class, 2);
  header.writeUInt32BE(record.ttl, 4);
  header.writeUInt16BE(record.data.length, 8);
  return Buffer.concat([name, header, record.data]);
}

function decodeRdata(
  buffer: Buffer,
  type: number,
  dataStart: number,
  dataEnd: number,
): Buffer {
  if (
    type === DNS_RECORD_TYPES.NS ||
    type === DNS_RECORD_TYPES.CNAME ||
    type === DNS_RECORD_TYPES.PTR
  ) {
    const decoded = decodeName(buffer, dataStart);
    if (decoded.offset !== dataEnd) throw new Error("Invalid domain-name RDATA");
    return encodeName(decoded.name);
  }

  if (type === DNS_RECORD_TYPES.MX) {
    if (dataStart + 2 >= dataEnd) throw new Error("Invalid MX record data");
    const decoded = decodeName(buffer, dataStart + 2);
    if (decoded.offset !== dataEnd) throw new Error("Invalid MX record data");
    return Buffer.concat([
      buffer.subarray(dataStart, dataStart + 2),
      encodeName(decoded.name),
    ]);
  }

  if (type === DNS_RECORD_TYPES.SOA) {
    const primary = decodeName(buffer, dataStart);
    const responsible = decodeName(buffer, primary.offset);
    if (responsible.offset + 20 !== dataEnd) throw new Error("Invalid SOA record data");
    return Buffer.concat([
      encodeName(primary.name),
      encodeName(responsible.name),
      buffer.subarray(responsible.offset, dataEnd),
    ]);
  }

  return buffer.subarray(dataStart, dataEnd);
}

export function decodeRecord(
  buffer: Buffer,
  offset = 0,
): { record: DNSRecord; offset: number } {
  const decodedName = decodeName(buffer, offset);
  const cursor = decodedName.offset;
  if (cursor + 10 > buffer.length) throw new Error("DNS record header is truncated");

  const type = buffer.readUInt16BE(cursor);
  const classValue = buffer.readUInt16BE(cursor + 2);
  const ttl = buffer.readUInt32BE(cursor + 4);
  const dataLength = buffer.readUInt16BE(cursor + 8);
  const dataStart = cursor + 10;
  const dataEnd = dataStart + dataLength;
  if (dataEnd > buffer.length) throw new Error("DNS record data is truncated");

  return {
    record: {
      name: decodedName.name,
      type,
      class: classValue,
      ttl,
      data: decodeRdata(buffer, type, dataStart, dataEnd),
    },
    offset: dataEnd,
  };
}
