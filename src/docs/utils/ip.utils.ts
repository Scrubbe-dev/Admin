import { isIPv4, isIPv6 } from 'net';
import { IPVersion } from '../types/ip.types';

export class IPConverter {
  static isIPv4(ip: string): boolean {
    throw new Error('Method not implemented.');
  }
  private static readonly IPV4_MAPPED_PREFIX = '::ffff:';
  private static readonly PRIVATE_IPV4_RANGES = [
    '10.0.0.0/8',
    '172.16.0.0/12',
    '192.168.0.0/16',
    '169.254.0.0/16'
  ];
  
  private static readonly PRIVATE_IPV6_RANGES = [
    'fc00::/7',  // Unique Local Address
    'fe80::/10', // Link-local Address
    '::1/128'    // Loopback
  ];

  static toIPv6(ipv4: string): string | null {
    if (!isIPv4(ipv4)) return null;
    
    // Convert to IPv4-mapped IPv6 format
    const parts = ipv4.split('.');
    if (parts.length !== 4) return null;
    
    return `${this.IPV4_MAPPED_PREFIX}${parts.join('.')}`;
  }

  static toIPv4(ipv6: string): string | null {
    if (!isIPv6(ipv6)) return null;

    // Check for IPv4-mapped format
    if (ipv6.startsWith(this.IPV4_MAPPED_PREFIX)) {
      return ipv6.slice(this.IPV4_MAPPED_PREFIX.length);
    }

    // Check for hex notation (::ffff:192.168.1.1)
    const hexMatch = ipv6.match(/^::ffff:([0-9a-f]{4}):([0-9a-f]{4})$/i);
    if (hexMatch) {
      try {
        const buffer = Buffer.from(hexMatch[1] + hexMatch[2], 'hex');
        return `${buffer[0]}.${buffer[1]}.${buffer[2]}.${buffer[3]}`;
      } catch {
        return null;
      }
    }

    return null;
  }

  static normalizeIP(ip: string, targetVersion: IPVersion): string | null {
    try {
      if (targetVersion === 4) {
        return isIPv4(ip) ? ip : this.toIPv4(ip);
      }
      return isIPv6(ip) ? ip : this.toIPv6(ip);
    } catch {
      return null;
    }
  }

  static isPrivateIP(ip: string): boolean {
    if (isIPv4(ip)) {
      return this.PRIVATE_IPV4_RANGES.some(range => this.isInCIDRRange(ip, range));
    }
    
    if (isIPv6(ip)) {
      return this.PRIVATE_IPV6_RANGES.some(range => this.isInCIDRRange(ip, range));
    }
    
    return false;
  }

  private static isInCIDRRange(ip: string, cidr: string): boolean {
    const [network, prefix] = cidr.split('/');
    const ipVersion = isIPv4(ip) ? 4 : 6;
    
    try {
      const ipParts = ip.split(ipVersion === 4 ? '.' : ':');
      const networkParts = network.split(ipVersion === 4 ? '.' : ':');
      const prefixLength = parseInt(prefix, 10);

      // Simple CIDR check (for demo purposes)
      return ipParts.slice(0, prefixLength / 8).every(
        (part, index) => part === networkParts[index]
      );
    } catch {
      return false;
    }
  }
}