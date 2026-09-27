import { describe, expect, test } from "bun:test";
import { decodeMessage, encodeMessage } from "./message";

describe("DNS messages", () => {
  test("encodes a query message", () => {
    const message = {
      header: {
        id: 0x1234,
        flags: 0x0100,
        questions: 1,
        answers: 0,
        authorities: 0,
        additionals: 0,
      },
      questions: [
        {
          name: "example.com",
          type: 1,
          class: 1,
        },
      ],
    };

    expect(encodeMessage(message)).toEqual(
      Buffer.from([
        0x12, 0x34,
        0x01, 0x00,
        0x00, 0x01,
        0x00, 0x00,
        0x00, 0x00,
        0x00, 0x00,
        0x07, ...Buffer.from("example"),
        0x03, ...Buffer.from("com"),
        0x00,
        0x00, 0x01,
        0x00, 0x01,
      ]),
    );
  });

  test("round-trips a query message", () => {
    const message = {
      header: {
        id: 0xabcd,
        flags: 0x0100,
        questions: 1,
        answers: 0,
        authorities: 0,
        additionals: 0,
      },
      questions: [
        {
          name: "example.com",
          type: 1,
          class: 1,
        },
      ],
    };

    expect(decodeMessage(encodeMessage(message))).toEqual(message);
  });

  test("rejects mismatched question counts", () => {
    const message = {
      header: {
        id: 1,
        flags: 0,
        questions: 0,
        answers: 0,
        authorities: 0,
        additionals: 0,
      },
      questions: [{ name: "example.com", type: 1, class: 1 }],
    };

    expect(() => encodeMessage(message)).toThrow(
      "Header question count does not match questions",
    );
  });
});
