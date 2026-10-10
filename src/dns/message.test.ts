import { describe, expect, test } from "bun:test";
import { decodeMessage, encodeMessage } from "./message";
import { encodeName } from "./name";

describe("DNS messages", () => {
  test("encodes a query message", () => {
    const message = {
      header: {
        id: 0x1234, flags: 0x0100, questions: 1, answers: 0, authorities: 0, additionals: 0,
      },
      questions: [{ name: "example.com", type: 1, class: 1 }],
      answers: [], authorities: [], additionals: [],
    };

    expect(encodeMessage(message)).toEqual(Buffer.from([
      0x12, 0x34, 0x01, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
      0x07, ...Buffer.from("example"), 0x03, ...Buffer.from("com"), 0x00, 0x00, 0x01, 0x00, 0x01,
    ]));
  });

  test("round-trips a message with an A answer", () => {
    const message = {
      header: {
        id: 0xabcd, flags: 0x8400, questions: 1, answers: 1, authorities: 0, additionals: 0,
      },
      questions: [{ name: "example.com", type: 1, class: 1 }],
      answers: [{ name: "example.com", type: 1, class: 1, ttl: 300, data: Buffer.from([127, 0, 0, 1]) }],
      authorities: [], additionals: [],
    };

    expect(decodeMessage(encodeMessage(message))).toEqual(message);
  });

  test("rejects mismatched section counts", () => {
    const message = {
      header: { id: 1, flags: 0, questions: 0, answers: 1, authorities: 0, additionals: 0 },
      questions: [], answers: [], authorities: [], additionals: [],
    };

    expect(() => encodeMessage(message)).toThrow("Header answer count does not match answers");
  });
});

  test("compresses repeated owner-name suffixes", () => {
    const message = {
      header: { id: 1, flags: 0x8000, questions: 1, answers: 1, authorities: 0, additionals: 0 },
      questions: [{ name: "example.com", type: 1, class: 1 }],
      answers: [{ name: "www.example.com", type: 1, class: 1, ttl: 60, data: Buffer.from([192, 0, 2, 1]) }],
      authorities: [], additionals: [],
    };
    const wire = encodeMessage(message);
    const answerOffset = 12 + Buffer.byteLength("\x07example\x03com\x00", "binary") + 4;
    expect(wire[answerOffset]).toBe(3);
    expect(wire[answerOffset + 4]).toBe(0xc0);
    expect(decodeMessage(wire).answers[0]?.name).toBe("www.example.com");
  });

  test("compresses domain names inside CNAME RDATA", () => {
    const message = {
      header: { id: 2, flags: 0x8000, questions: 1, answers: 1, authorities: 0, additionals: 0 },
      questions: [{ name: "example.com", type: 5, class: 1 }],
      answers: [{ name: "alias.example.com", type: 5, class: 1, ttl: 60, data: encodeName("example.com") }],
      authorities: [], additionals: [],
    };
    const decoded = decodeMessage(encodeMessage(message));
    expect(decoded.answers[0]?.name).toBe("alias.example.com");
    expect(decoded.answers[0]?.data).toEqual(encodeName("example.com"));
  });

  test("rejects trailing bytes after declared DNS sections", () => {
    const message = encodeMessage({
      header: { id: 3, flags: 0, questions: 0, answers: 0, authorities: 0, additionals: 0 },
      questions: [], answers: [], authorities: [], additionals: [],
    });
    expect(() => decodeMessage(Buffer.concat([message, Buffer.from([1])]))).toThrow(
      "Unexpected trailing bytes in DNS message",
    );
  });
});
