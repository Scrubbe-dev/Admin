// src/modules/system/system.service.ts
import { Request } from 'express';
import { WebServiceClient } from '@maxmind/geoip2-node';
import UAParser from 'ua-parser-js';
import { env } from '../../config/env';
import { SystemInfo, GeoData, NetworkData, DeviceData } from './system.types';

const SAFE_IP_RANGES = ['192.168.', '10.0.', '172.16.', '127.0.0.1', '::1'];

export class SystemService {
  private geoIpClient: WebServiceClient;

  constructor() {
    this.geoIpClient = new WebServiceClient(
    env.MAXMIND_ACCOUNT_ID,
    env.MAXMIND_LICENSE_KEY,
  );
  }

  public getClientIp(req: Request): string {
    const xForwardedFor = req.headers['x-forwarded-for'];
    const ip = Array.isArray(xForwardedFor)
      ? xForwardedFor[0]
      : xForwardedFor?.split(',')[0] || req.socket.remoteAddress || '';

    return ip.replace(/^::ffff:/, '');
  }

  private isPrivateIp(ip: string): boolean {
    return SAFE_IP_RANGES.some(range => ip.startsWith(range));
  }

  private async getGeoData(ip: string): Promise<GeoData> {
    if (this.isPrivateIp(ip)) return {};
    
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
    } catch (error) {
      console.error('GeoIP lookup failed:', error);
      return {};
    }
  }

  private async getNetworkData(ip: string): Promise<NetworkData> {
    if (this.isPrivateIp(ip)) return { isProxy: false };

    try {
      const response = await this.geoIpClient.insights(ip);
      return {
        isp: response.traits?.isp,
        asn: response.traits?.autonomousSystemNumber,
        isProxy: !!response.traits?.isAnonymousProxy
      };
    } catch (error) {
      console.error('Network data lookup failed:', error);
      return { isProxy: false };
    }
  }

  private getDeviceData(req: Request): DeviceData {
    const parser = new UAParser.UAParser(req.headers['user-agent']);
    const { os, browser, device } = parser.getResult();

    return {
      os: os.name || 'Unknown OS',
      browser: browser.name || 'Unknown Browser',
      deviceModel: device.model,
      deviceType: device.type
    };
  }

  public async collectSystemInfo(req: Request): Promise<SystemInfo> {
    const ip = this.getClientIp(req);
    const [location, network, device] = await Promise.all([
      this.getGeoData(ip),
      this.getNetworkData(ip),
      this.getDeviceData(req)
    ]);

    return { ip, location, network, device };
  }
}