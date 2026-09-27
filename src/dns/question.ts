import { decodeName, encodeName } from "./name";

export interface DNSQuestion {
  name: string;
  type: number;
  class: number;
}

export function encodeQuestion(question: DNSQuestion): Buffer {
  const name = encodeName(question.name);
  const buffer = Buffer.alloc(4);

  buffer.writeUInt16BE(question.type, 0);
  buffer.writeUInt16BE(question.class, 2);

  return Buffer.concat([name, buffer]);
}

export function decodeQuestion(
  buffer: Buffer,
  offset = 0,
): { question: DNSQuestion; offset: number } {
  const decoded = decodeName(buffer, offset);

  if (decoded.offset + 4 > buffer.length) {
    throw new Error("DNS question is truncated");
  }

  return {
    question: {
      name: decoded.name,
      type: buffer.readUInt16BE(decoded.offset),
      class: buffer.readUInt16BE(decoded.offset + 2),
    },
    offset: decoded.offset + 4,
  };
}
