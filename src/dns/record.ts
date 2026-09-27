import { decodeName, encodeName } from "./name";

export interface DNSRecord {
  name: string;
  type: number;
  class: number;
  ttl: number;
  data: Buffer;
}

export function encodeRecord(record: DNSRecord): Buffer {
  const name = encodeName(record.name);
  const header = Buffer.alloc(10);

  header.writeUInt16BE(record.type, 0);
  header.writeUInt16BE(record.class, 2);
  header.writeUInt32BE(record.ttl, 4);
  header.writeUInt16BE(record.data.length, 8);

  return Buffer.concat([name, header, record.data]);
}

export function decodeRecord(
  buffer: Buffer,
  offset = 0,
): { record: DNSRecord; offset: number } {
  const decodedName = decodeName(buffer, offset);
  const cursor = decodedName.offset;

  if (cursor + 10 > buffer.length) {
    throw new Error("DNS record header is truncated");
  }

  const type = buffer.readUInt16BE(cursor);
  const classValue = buffer.readUInt16BE(cursor + 2);
  const ttl = buffer.readUInt32BE(cursor + 4);
  const dataLength = buffer.readUInt16BE(cursor + 8);
  const dataStart = cursor + 10;
  const dataEnd = dataStart + dataLength;

  if (dataEnd > buffer.length) {
    throw new Error("DNS record data is truncated");
  }

  return {
    record: {
      name: decodedName.name,
      type,
      class: classValue,
      ttl,
      data: buffer.subarray(dataStart, dataEnd),
    },
    offset: dataEnd,
  };
}
