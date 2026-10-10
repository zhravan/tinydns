import { createDNSServer } from "./server/udp";

const host = process.env.TINYDNS_HOST ?? "127.0.0.1";
const portValue = process.env.TINYDNS_PORT ?? "5353";
const port = Number(portValue);

if (!Number.isInteger(port) || port < 0 || port > 65535) {
  throw new Error("TINYDNS_PORT must be an integer between 0 and 65535");
}

const dnsServer = createDNSServer({ host, port });
await dnsServer.start();

console.log(`tinydns listening on udp://${host}:${port}`);
