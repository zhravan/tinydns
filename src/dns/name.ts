export type DNSCompressionMap = Map<string, number>;

function normalizeName(name: string): string {
  return name.endsWith(".") ? name.slice(0, -1) : name;
}

export function encodeName(name: string): Buffer {
  const normalized = normalizeName(name);
  if (normalized.length === 0) return Buffer.from([0]);

  const labels = normalized.split(".");
  const parts: Buffer[] = [];
  let wireLength = 1;

  for (const label of labels) {
    const bytes = Buffer.from(label, "utf8");
    if (bytes.length === 0) throw new Error("DNS labels must not be empty");
    if (bytes.length > 63) throw new Error("DNS label must be at most 63 bytes");
    wireLength += bytes.length + 1;
    parts.push(Buffer.from([bytes.length]), bytes);
  }

  if (wireLength > 255) throw new Error("DNS name must be at most 255 bytes");
  parts.push(Buffer.from([0]));
  return Buffer.concat(parts);
}

export function encodeNameCompressed(
  name: string,
  offset: number,
  suffixOffsets: DNSCompressionMap,
): Buffer {
  const normalized = normalizeName(name);
  if (normalized.length === 0) return Buffer.from([0]);

  const labels = normalized.split(".");
  const parts: Buffer[] = [];
  let pointerIndex = labels.length;
  let pointerOffset: number | undefined;

  for (let index = 0; index < labels.length; index += 1) {
    const suffix = labels.slice(index).join(".").toLowerCase();
    const candidate = suffixOffsets.get(suffix);
    if (candidate !== undefined && candidate < 0x4000) {
      pointerIndex = index;
      pointerOffset = candidate;
      break;
    }
  }

  let currentOffset = offset;
  for (let index = 0; index < pointerIndex; index += 1) {
    const label = labels[index]!;
    const bytes = Buffer.from(label, "utf8");
    if (bytes.length === 0) throw new Error("DNS labels must not be empty");
    if (bytes.length > 63) throw new Error("DNS label must be at most 63 bytes");
    if (currentOffset < 0x4000) {
      suffixOffsets.set(labels.slice(index).join(".").toLowerCase(), currentOffset);
    }
    parts.push(Buffer.from([bytes.length]), bytes);
    currentOffset += bytes.length + 1;
  }

  if (pointerOffset !== undefined) {
    const pointer = Buffer.alloc(2);
    pointer.writeUInt16BE(0xc000 | pointerOffset, 0);
    parts.push(pointer);
  } else {
    parts.push(Buffer.from([0]));
    currentOffset += 1;
  }

  const encoded = Buffer.concat(parts);
  if (encoded.length > 255) throw new Error("DNS name must be at most 255 bytes");
  return encoded;
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

    const length = buffer[cursor]!;

    if ((length & 0xc0) === 0xc0) {
      if (cursor + 1 >= buffer.length) throw new Error("Truncated DNS compression pointer");

      const pointer = ((length & 0x3f) << 8) | buffer[cursor + 1]!;
      if (pointer >= buffer.length) throw new Error("DNS compression pointer exceeds buffer");
      if (visited.has(pointer)) throw new Error("DNS name compression loop");
      visited.add(pointer);

      if (!jumped) {
        nextOffset = cursor + 2;
        jumped = true;
      }

      cursor = pointer;
      continue;
    }

    if ((length & 0xc0) !== 0) throw new Error("Invalid DNS label length");
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
