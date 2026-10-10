import { DNS_RECORD_TYPES } from "./constants";
import { decodeHeader, encodeHeader, type DNSHeader } from "./header";
import { decodeName, encodeNameCompressed, type DNSCompressionMap } from "./name";
import { decodeQuestion, type DNSQuestion } from "./question";
import { decodeRecord, type DNSRecord } from "./record";

export interface DNSMessage {
  header: DNSHeader;
  questions: DNSQuestion[];
  answers: DNSRecord[];
  authorities: DNSRecord[];
  additionals: DNSRecord[];
}

function encodeCompressedRecord(
  record: DNSRecord,
  offset: number,
  suffixOffsets: DNSCompressionMap,
): Buffer {
  const owner = encodeNameCompressed(record.name, offset, suffixOffsets);
  const fixedHeader = Buffer.alloc(10);
  fixedHeader.writeUInt16BE(record.type, 0);
  fixedHeader.writeUInt16BE(record.class, 2);
  fixedHeader.writeUInt32BE(record.ttl, 4);

  const rdataOffset = offset + owner.length + fixedHeader.length;
  let data = record.data;

  if (
    record.type === DNS_RECORD_TYPES.NS ||
    record.type === DNS_RECORD_TYPES.CNAME ||
    record.type === DNS_RECORD_TYPES.PTR
  ) {
    const decoded = decodeName(record.data);
    if (decoded.offset !== record.data.length) throw new Error("Invalid domain-name RDATA");
    data = encodeNameCompressed(decoded.name, rdataOffset, suffixOffsets);
  } else if (record.type === DNS_RECORD_TYPES.MX) {
    if (record.data.length < 3) throw new Error("Invalid MX record data");
    const decoded = decodeName(record.data, 2);
    if (decoded.offset !== record.data.length) throw new Error("Invalid MX record data");
    data = Buffer.concat([
      record.data.subarray(0, 2),
      encodeNameCompressed(decoded.name, rdataOffset + 2, suffixOffsets),
    ]);
  } else if (record.type === DNS_RECORD_TYPES.SOA) {
    const primary = decodeName(record.data, 0);
    const responsible = decodeName(record.data, primary.offset);
    if (responsible.offset + 20 !== record.data.length) throw new Error("Invalid SOA record data");
    const primaryData = encodeNameCompressed(primary.name, rdataOffset, suffixOffsets);
    const responsibleData = encodeNameCompressed(
      responsible.name,
      rdataOffset + primaryData.length,
      suffixOffsets,
    );
    data = Buffer.concat([
      primaryData,
      responsibleData,
      record.data.subarray(responsible.offset),
    ]);
  }

  if (data.length > 0xffff) throw new Error("DNS record data exceeds 65535 bytes");
  fixedHeader.writeUInt16BE(data.length, 8);
  return Buffer.concat([owner, fixedHeader, data]);
}

export function encodeMessage(message: DNSMessage): Buffer {
  if (message.questions.length !== message.header.questions) {
    throw new Error("Header question count does not match questions");
  }
  if (message.answers.length !== message.header.answers) {
    throw new Error("Header answer count does not match answers");
  }
  if (message.authorities.length !== message.header.authorities) {
    throw new Error("Header authority count does not match authorities");
  }
  if (message.additionals.length !== message.header.additionals) {
    throw new Error("Header additional count does not match additionals");
  }

  const parts: Buffer[] = [encodeHeader(message.header)];
  const suffixOffsets: DNSCompressionMap = new Map();
  let offset = 12;

  for (const question of message.questions) {
    const name = encodeNameCompressed(question.name, offset, suffixOffsets);
    const tail = Buffer.alloc(4);
    tail.writeUInt16BE(question.type, 0);
    tail.writeUInt16BE(question.class, 2);
    parts.push(name, tail);
    offset += name.length + tail.length;
  }

  for (const section of [message.answers, message.authorities, message.additionals]) {
    for (const record of section) {
      const encoded = encodeCompressedRecord(record, offset, suffixOffsets);
      parts.push(encoded);
      offset += encoded.length;
    }
  }

  return Buffer.concat(parts);
}

export function decodeMessage(buffer: Buffer): DNSMessage {
  const header = decodeHeader(buffer);
  const questions: DNSQuestion[] = [];
  const answers: DNSRecord[] = [];
  const authorities: DNSRecord[] = [];
  const additionals: DNSRecord[] = [];
  let offset = 12;

  for (let index = 0; index < header.questions; index += 1) {
    const decoded = decodeQuestion(buffer, offset);
    questions.push(decoded.question);
    offset = decoded.offset;
  }
  for (let index = 0; index < header.answers; index += 1) {
    const decoded = decodeRecord(buffer, offset);
    answers.push(decoded.record);
    offset = decoded.offset;
  }
  for (let index = 0; index < header.authorities; index += 1) {
    const decoded = decodeRecord(buffer, offset);
    offset = decoded.offset;
    authorities.push(decoded.record);
  }
  for (let index = 0; index < header.additionals; index += 1) {
    const decoded = decodeRecord(buffer, offset);
    additionals.push(decoded.record);
    offset = decoded.offset;
  }

  if (offset !== buffer.length) throw new Error("Unexpected trailing bytes in DNS message");
  return { header, questions, answers, authorities, additionals };
}
