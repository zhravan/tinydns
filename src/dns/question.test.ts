import { describe, expect, test } from "bun:test";
import { decodeQuestion, encodeQuestion } from "./question";

describe("DNS questions", () => {
  test("encodes a DNS A-record question", () => {
    const encoded = encodeQuestion({
      name: "example.com",
      type: 1,
      class: 1,
    });

    expect(encoded).toEqual(
      Buffer.from([
        0x07, ...Buffer.from("example"),
        0x03, ...Buffer.from("com"),
        0x00,
        0x00, 0x01,
        0x00, 0x01,
      ]),
    );
  });

  test("decodes a DNS question", () => {
    const buffer = encodeQuestion({
      name: "example.com",
      type: 1,
      class: 1,
    });

    expect(decodeQuestion(buffer)).toEqual({
      question: {
        name: "example.com",
        type: 1,
        class: 1,
      },
      offset: buffer.length,
    });
  });

  test("rejects truncated questions", () => {
    const buffer = Buffer.from([0x07, ...Buffer.from("example"), 0x03, ...Buffer.from("com"), 0x00, 0x00]);

    expect(() => decodeQuestion(buffer)).toThrow("DNS question is truncated");
  });
});
