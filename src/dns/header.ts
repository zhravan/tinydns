export interface DNSHeader {
  id: number;
  flags: number;
  questions: number;
  answers: number;
  authorities: number;
  additionals: number;
}

export function encodeHeader(header: DNSHeader): Buffer {
  const buffer = Buffer.alloc(12);

  buffer.writeUInt16BE(header.id, 0);
  buffer.writeUInt16BE(header.flags, 2);
  buffer.writeUInt16BE(header.questions, 4);
  buffer.writeUInt16BE(header.answers, 6);
  buffer.writeUInt16BE(header.authorities, 8);
  buffer.writeUInt16BE(header.additionals, 10);

  return buffer;
}

export function decodeHeader(buffer: Buffer): DNSHeader {
  if (buffer.length < 12) {
    throw new Error("DNS header must be at least 12 bytes");
  }

  return {
    id: buffer.readUInt16BE(0),
    flags: buffer.readUInt16BE(2),
    questions: buffer.readUInt16BE(4),
    answers: buffer.readUInt16BE(6),
    authorities: buffer.readUInt16BE(8),
    additionals: buffer.readUInt16BE(10),
  };
}
