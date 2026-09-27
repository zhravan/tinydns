import { decodeHeader, encodeHeader, type DNSHeader } from "./header";
import { decodeQuestion, encodeQuestion, type DNSQuestion } from "./question";
import { decodeRecord, encodeRecord, type DNSRecord } from "./record";

export interface DNSMessage {
  header: DNSHeader;
  questions: DNSQuestion[];
  answers: DNSRecord[];
  authorities: DNSRecord[];
  additionals: DNSRecord[];
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

  return Buffer.concat([
    encodeHeader(message.header),
    ...message.questions.map(encodeQuestion),
    ...message.answers.map(encodeRecord),
    ...message.authorities.map(encodeRecord),
    ...message.additionals.map(encodeRecord),
  ]);
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
    authorities.push(decoded.record);
    offset = decoded.offset;
  }

  for (let index = 0; index < header.additionals; index += 1) {
    const decoded = decodeRecord(buffer, offset);
    additionals.push(decoded.record);
    offset = decoded.offset;
  }

  return { header, questions, answers, authorities, additionals };
}
