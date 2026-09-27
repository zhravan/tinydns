# tinydns

A DNS server built from scratch with Bun and TypeScript.

This is a learning project focused on understanding DNS from the wire up.

## Goals

- Understand the DNS wire format
- Build DNS packet encoding and decoding from scratch
- Implement a UDP DNS server
- Support common DNS record types
- Build an authoritative DNS server
- Implement recursive resolution
- Explore caching, TTLs, and TCP fallback

## Development

Install [Bun](https://bun.sh/), then run:

```bash
bun install
bun run dev
bun test
```

## Learning approach

The implementation intentionally avoids DNS libraries. Each feature is introduced in small, focused commits so the Git history doubles as a DNS learning path.
