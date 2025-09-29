"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.convertIP = void 0;
const ip_address_1 = require("ip-address");
const convertIP = (ip) => {
    try {
        // First check if it's a valid IPv4
        const ipv4 = new ip_address_1.Address4(ip);
        if (ip_address_1.Address4.isValid(ip)) {
            return ipv4.correctForm();
        }
    }
    catch (error) {
        // Not a valid IPv4, continue to check IPv6
    }
    try {
        const ipv6 = new ip_address_1.Address6(ip);
        if (ip_address_1.Address6.isValid(ip)) {
            if (ipv6.is4()) {
                return ipv6.to4().correctForm();
            }
        }
    }
    catch (error) {
        console.log(error.message);
    }
    return null;
};
exports.convertIP = convertIP;
