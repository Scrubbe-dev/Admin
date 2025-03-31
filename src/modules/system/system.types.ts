import { IPGeoResponse } from "../../types/geolocation";

// src/modules/system/system.types.ts
export type GeoData = {
    country?: string;
    city?: string;
    coordinates?: [number, number];
  };
  
  export type NetworkData = {
    isp?: string;
    asn?: number;
    isProxy: boolean;
  };
  
  export type DeviceData = {
    os: string;
    browser: string;
    deviceModel?: string;
    deviceType?: string;
  };
  
  export type SystemInfo = {
    ip: string;
    location: GeoData;
    network: NetworkData;
    device: DeviceData;
    usersDetails?: IPGeoResponse
  };