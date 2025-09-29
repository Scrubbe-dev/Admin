"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IPConverter = void 0;
// src/utils/ipUtils.ts
const net_1 = require("net");
class IPConverter {
    /**
     * Convert IPv4 to IPv4-mapped IPv6 address
     * Example: 192.0.2.128 → ::ffff:192.0.2.128
     */
    static toIPv6(ipv4) {
        if (!(0, net_1.isIPv4)(ipv4))
            return null;
        const parts = ipv4.split('.');
        if (parts.length !== 4)
            return null;
        return `::ffff:${parts.join('.')}`;
    }
    /**
     * Convert IPv4-mapped IPv6 address to IPv4
     * Example: ::ffff:192.0.2.128 → 192.0.2.128
     */
    static toIPv4(ipv6) {
        if (!(0, net_1.isIPv6)(ipv6))
            return null;
        // Check for IPv4-mapped format
        const ipv4Match = ipv6.match(/^::ffff:(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})$/i);
        if (ipv4Match)
            return ipv4Match[1];
        // Check for hex notation
        const hexMatch = ipv6.match(/^::ffff:([0-9a-f]{4}):([0-9a-f]{4})$/i);
        if (hexMatch) {
            const buffer = Buffer.from(hexMatch[1] + hexMatch[2], 'hex');
            return `${buffer[0]}.${buffer[1]}.${buffer[2]}.${buffer[3]}`;
        }
        return null;
    }
    /**
     * Normalize IP address to preferred format
     */
    static normalizeIP(ip, targetVersion = 4) {
        if (targetVersion === 4) {
            return (0, net_1.isIPv4)(ip) ? ip : this.toIPv4(ip);
        }
        return (0, net_1.isIPv6)(ip) ? ip : this.toIPv6(ip);
    }
}
exports.IPConverter = IPConverter;
