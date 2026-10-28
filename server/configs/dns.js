import dns from "node:dns";

const LOOPBACK = /^(127\.|::1$)/;

// Node's c-ares resolver falls back to 127.0.0.1 when Windows has no global
// nameserver configured, so every lookup fails with ECONNREFUSED. Mongoose then
// buffers operations until they time out.
//
// This lives in its own module because more than one entry point talks to Mongo:
// configs/db.js (the server) and scripts/setup-clerk.js (the bootstrap). Keeping
// it here stops a second caller from silently skipping the fix.
export const ensureDnsServers = () => {
    const servers = dns.getServers();
    const usable = servers.filter((server) => !LOOPBACK.test(server));
    if (usable.length) return;

    const fallback = (process.env.DNS_SERVERS || "8.8.8.8,1.1.1.1")
        .split(",")
        .map((server) => server.trim())
        .filter(Boolean);
    dns.setServers(fallback);
    console.log(`DNS servers [${servers.join(", ")}] unreachable, using [${fallback.join(", ")}]`);
};