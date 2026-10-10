# tinydns

A DNS server built from scratch with Bun and TypeScript.

This is a learning project focused on understanding DNS from the wire up.

## Current capabilities

- DNS wire-format message parsing and serialization
- DNS name compression for owner names and domain-name RDATA
- UDP authoritative DNS server
- A, AAAA, CNAME, NS, SOA, MX, TXT, and PTR record encoders/decoders
- In-memory zone lookup
- FORMERR responses for malformed queries
- Configurable bind host and port

The implementation intentionally avoids DNS libraries.

## Development

Install [Bun](https://bun.sh/), then run:

```bash
bun install
bun run dev
bun test
```

## Configuration

The server defaults to `127.0.0.1:5353`. Override it with environment variables:

```bash
TINYDNS_HOST=127.0.0.1 TINYDNS_PORT=5354 bun run dev
```

The server currently uses UDP. Recursive resolution, TCP transport, zone-file loading, and caching remain future goals.

## Learning approach

Each feature is introduced in small, focused commits so the Git history doubles as a DNS learning path.
