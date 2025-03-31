import { Request } from 'express';
import { isIPv4, isIPv6 } from 'net';

export function getClientIPv4(req: Request): string | null {
  try {
    const forwardedHeader = req.headers['forwarded'];
    const forwardedIps = forwardedHeader?.match(/for=([^;]+)/i);
    const firstForwarded = forwardedIps ? forwardedIps[1].trim() : null;
    const xForwardedFor = Array.isArray(req.headers['x-forwarded-for'])
      ? req.headers['x-forwarded-for'][0]
      : req.headers['x-forwarded-for'];
    const xForwardedIps = xForwardedFor?.split(',').map(ip => ip.trim());
    const connectionIp = req.socket.remoteAddress;
    const rawIp = firstForwarded || xForwardedIps?.[0] || connectionIp;

    if (!rawIp) return null;
    const ip = rawIp.replace(/:\d+$/, '');
    if (isIPv6(ip)) {
      const ipv4 = convertIPv6ToIPv4(ip);
      return ipv4 && isIPv4(ipv4) ? ipv4 : null;
    }

    return isIPv4(ip) ? ip : null;
  } catch (error) {
    console.error('IP detection error:', error);
    return null;
  }
}


function convertIPv6ToIPv4(ipv6: string): string | null {
  const ipv4Match = ipv6.match(/^::ffff:((\d{1,3}\.){3}\d{1,3})$/i);
  if (ipv4Match) return ipv4Match[1];
  if (ipv6.startsWith('::ffff:')) {
    const hexParts = ipv6.slice(7).split(':');
    if (hexParts.length === 2) {
      try {
        const buffer = Buffer.from(hexParts.join(''), 'hex');
        return `${buffer[0]}.${buffer[1]}.${buffer[2]}.${buffer[3]}`;
      } catch {
        return null;
      }
    }
  }
  
  return null;
}