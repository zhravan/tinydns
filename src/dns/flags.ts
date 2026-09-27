export interface DNSFlags {
  response: boolean;
  opcode: number;
  authoritative: boolean;
  truncated: boolean;
  recursionDesired: boolean;
  recursionAvailable: boolean;
  rcode: number;
}

export function encodeFlags(flags: DNSFlags): number {
  let value = 0;

  if (flags.response) value |= 0x8000;
  value |= (flags.opcode & 0x0f) << 11;
  if (flags.authoritative) value |= 0x0400;
  if (flags.truncated) value |= 0x0200;
  if (flags.recursionDesired) value |= 0x0100;
  if (flags.recursionAvailable) value |= 0x0080;
  value |= flags.rcode & 0x000f;

  return value;
}

export function decodeFlags(value: number): DNSFlags {
  return {
    response: Boolean(value & 0x8000),
    opcode: (value >>> 11) & 0x0f,
    authoritative: Boolean(value & 0x0400),
    truncated: Boolean(value & 0x0200),
    recursionDesired: Boolean(value & 0x0100),
    recursionAvailable: Boolean(value & 0x0080),
    rcode: value & 0x000f,
  };
}
