import { decodeHeader, encodeHeader, type DNSHeader } from "./header";
import { decodeQuestion, encodeQuestion, type DNSQuestion } from "./question";

export interface DNSMessage {
  header: DNSHeader;
  questions: DNSQuestion[];
}

export function encodeMessage(message: DNSMessage): Buffer {
  if (message.questions.length !== message.header.questions) {
    throw new Error("Header question count does not match questions");
  }

  return Buffer.concat([
    encodeHeader(message.header),
    ...message.questions.map(encodeQuestion),
  ]);
}

export function decodeMessage(buffer: Buffer): DNSMessage {
  const header = decodeHeader(buffer);
  const questions: DNSQuestion[] = [];
  let offset = 12;

  for (let index = 0; index < header.questions; index += 1) {
    const decoded = decodeQuestion(buffer, offset);
    questions.push(decoded.question);
    offset = decoded.offset;
  }

  return { header, questions };
}
