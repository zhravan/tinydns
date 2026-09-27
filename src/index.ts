import { createDNSServer } from "./server/udp";

const dnsServer = createDNSServer();

await dnsServer.start();

console.log("tinydns listening on udp://127.0.0.1:5353");
