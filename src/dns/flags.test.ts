import { describe, expect, test } from "bun:test";
import { decodeFlags, encodeFlags } from "./flags";

describe("DNS flags", () => {
  test("encodes response flags", () => {
    expect(
      encodeFlags({
        response: true,
        opcode: 0,
        authoritative: true,
        truncated: false,
        recursionDesired: true,
        recursionAvailable: false,
        rcode: 0,
      }),
    ).toBe(0x8500);
  });

  test("decodes response flags", () => {
    expect(decodeFlags(0x8580)).toEqual({
      response: true,
      opcode: 0,
      authoritative: true,
      truncated: false,
      recursionDesired: true,
      recursionAvailable: true,
      rcode: 0,
    });
  });

  test("round-trips flags", () => {
    const flags = {
      response: true,
      opcode: 0,
      authoritative: true,
      truncated: true,
      recursionDesired: true,
      recursionAvailable: true,
      rcode: 3,
    };

    expect(decodeFlags(encodeFlags(flags))).toEqual(flags);
  });
});
