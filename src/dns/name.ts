export function encodeName(name: string): Buffer {
  const normalized = name.endsWith(".") ? name.slice(0, -1) : name;

  if (normalized.length === 0) return Buffer.from([0]);

  const labels = normalized.split(".");
  const parts: Buffer[] = [];

  for (const label of labels) {
    const bytes = Buffer.from(label, "utf8");
    if (bytes.length > 63) throw new Error("DNS label must be at most 63 bytes");
    parts.push(Buffer.from([bytes.length]), bytes);
  }

  parts.push(Buffer.from([0]));
  return Buffer.concat(parts);
}

export function decodeName(
  buffer: Buffer,
  offset = 0,
): { name: string; offset: number } {
  const labels: string[] = [];
  let cursor = offset;
  let nextOffset = offset;
  let jumped = false;
  const visited = new Set<number>();

  while (true) {
    if (cursor >= buffer.length) throw new Error("Unexpected end of DNS name");

    const length = buffer[cursor];

    if ((length & 0xc0) === 0xc0) {
      if (cursor + 1 >= buffer.length) throw new Error("Truncated DNS compression pointer");

      const pointer = ((length & 0x3f) << 8) | buffer[cursor + 1];

      if (visited.has(pointer)) throw new Error("DNS name compression loop");
      visited.add(pointer);

      if (!jumped) {
        nextOffset = cursor + 2;
        jumped = true;
      }

      cursor = pointer;
      continue;
    }

    cursor += 1;

    if (length === 0) {
      return { name: labels.join("."), offset: jumped ? nextOffset : cursor };
    }

    if (length > 63) throw new Error("Invalid DNS label length");
    if (cursor + length > buffer.length) throw new Error("DNS label exceeds buffer");

    labels.push(buffer.subarray(cursor, cursor + length).toString("utf8"));
    cursor += length;

    if (!jumped) nextOffset = cursor;
  }
}
