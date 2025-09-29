"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ipConversionMiddleware = void 0;
const ipUtils_1 = require("../../common/utils/ipUtils");
const net_1 = require("net");
const ipConversionMiddleware = (targetVersion = 4) => {
    return (req, res, next) => {
        try {
            // Get client IP considering proxies
            const clientIp = getClientIp(req);
            if (!clientIp) {
                return res.status(400).json({ error: 'Could not determine IP address' });
            }
            req.clientIp = clientIp;
            req.convertedIp = ipUtils_1.IPConverter.normalizeIP(clientIp, targetVersion) || clientIp;
            next();
        }
        catch (error) {
            console.error('IP Conversion Error:', error);
            next(error);
        }
    };
};
exports.ipConversionMiddleware = ipConversionMiddleware;
// Enhanced IP detection with proxy support
function getClientIp(req) {
    const headers = [
        'x-client-ip', // Custom header
        'x-forwarded-for', // Standard proxy header
        'cf-connecting-ip', // Cloudflare
        'fastly-client-ip', // Fastly
        'true-client-ip', // Akamai
        'x-real-ip', // Nginx
        'x-cluster-client-ip', // Rackspace LB
    ];
    for (const header of headers) {
        const value = req.headers[header];
        if (typeof value === 'string') {
            const ips = value.split(',').map(ip => ip.trim());
            const validIp = ips.find(ip => (0, net_1.isIPv4)(ip) || (0, net_1.isIPv6)(ip));
            if (validIp)
                return validIp;
        }
    }
    return req.socket.remoteAddress || null;
}
