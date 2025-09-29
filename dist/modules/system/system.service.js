"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SystemService = void 0;
const geoip2_node_1 = require("@maxmind/geoip2-node");
const ua_parser_js_1 = __importDefault(require("ua-parser-js"));
const env_1 = require("../../config/env");
const http_client_1 = require("../../lib/http-client");
const get_user_ip_1 = __importDefault(require("get-user-ip"));
const checkAndGet_1 = require("../../lib/checkAndGet");
const SAFE_IP_RANGES = [
    '10.',
    '172.16.',
    '172.17.',
    '172.18.',
    '172.19.',
    '172.20.',
    '172.21.',
    '172.22.',
    '172.23.',
    '172.24.',
    '172.25.',
    '172.26.',
    '172.27.',
    '172.28.',
    '172.29.',
    '172.30.',
    '172.31.',
    '192.168.',
    '127.',
    '169.254.',
    '224.',
    '225.',
    '226.',
    '227.',
    '228.',
    '229.',
    '230.',
    '231.',
    '232.',
    '233.',
    '234.',
    '235.',
    '236.',
    '237.',
    '238.',
    '239.',
    '240.',
    '241.',
    '242.',
    '243.',
    '244.',
    '245.',
    '246.',
    '247.',
    '248.',
    '249.',
    '250.',
    '251.',
    '252.',
    '253.',
    '254.',
    '255.',
    '::1',
    'fc00:',
    'fe80:',
    'ff00:',
    '2001:db8:',
    '::ffff:0:0',
    '100:',
    '172.17.',
    '172.18.',
    '172.19.',
    '172.20.',
    '192.0.0.',
    '192.0.2.',
    '198.51.100.',
    '203.0.113.',
    '100.64.',
    '10.244.',
    '10.96.'
];
class SystemService {
    geoIpClient;
    constructor() {
        this.geoIpClient = new geoip2_node_1.WebServiceClient(env_1.env.MAXMIND_ACCOUNT_ID, env_1.env.MAXMIND_LICENSE_KEY);
    }
    getClientIp(req) {
        const xForwardedFor = req.headers['x-forwarded-for'];
        const ip = Array.isArray(xForwardedFor)
            ? xForwardedFor[0]
            : xForwardedFor?.split(',')[0] || req.socket.remoteAddress || '';
        return ip.replace(/^::ffff:/, '');
    }
    isPrivateIp(ip) {
        return SAFE_IP_RANGES.some(range => ip.startsWith(range));
    }
    async getGeoData(ip) {
        if (this.isPrivateIp(ip))
            return {};
        try {
            const response = await this.geoIpClient.city(ip);
            return {
                country: response.country?.isoCode,
                city: response.city?.names.en,
                coordinates: response.location?.latitude && response.location?.longitude
                    ? [
                        Number(response.location.latitude.toFixed(2)),
                        Number(response.location.longitude.toFixed(2))
                    ]
                    : undefined
            };
        }
        catch (error) {
            console.error('GeoIP lookup failed:', error);
            return {};
        }
    }
    async getNetworkData(ip) {
        if (this.isPrivateIp(ip))
            return { isProxy: false };
        try {
            const response = await this.geoIpClient.insights(ip);
            return {
                isp: response.traits?.isp,
                asn: response.traits?.autonomousSystemNumber,
                isProxy: !!response.traits?.isAnonymousProxy
            };
        }
        catch (error) {
            console.error('Network data lookup failed:', error);
            return { isProxy: false };
        }
    }
    getDeviceData(req) {
        const parser = new ua_parser_js_1.default.UAParser(req.headers['user-agent']);
        const { os, browser, device } = parser.getResult();
        return {
            os: os.name || 'Unknown OS',
            browser: browser.name || 'Unknown Browser',
            deviceModel: device.model,
            deviceType: device.type
        };
    }
    async getUserInforByIPv4(ip) {
        try {
            const response = await http_client_1.api.get(env_1.env.BASE_SEARCH_URL + `/${ip}`);
            if (response.status !== 200) {
                throw new Error(`API request failed with status ${response.status}`);
            }
            return response.data;
        }
        catch (error) {
            console.log(error.message);
        }
    }
    async collectSystemInfo(req) {
        const ip = (0, get_user_ip_1.default)(req);
        const ipv4 = (0, checkAndGet_1.convertIP)(ip);
        console.log(ipv4, ip);
        const [location, network, device, usersDetails] = await Promise.all([
            this.getGeoData(ip),
            this.getNetworkData(ip),
            this.getDeviceData(req),
            this.getUserInforByIPv4(String(ipv4))
        ]);
        return { ip, location, network, device, usersDetails };
    }
}
exports.SystemService = SystemService;
