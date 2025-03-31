/**
 * IP Geolocation Response Type
 */
export interface IPGeoResponse {
    ip: string;
    type: 'ipv4' | 'ipv6';
    city?: string;
    connection?: {
      asn?: number;
      isp?: string;
    };
    continent_code?: string;
    continent_name?: string;
    country_code?: string;
    country_name?: string;
    currencies?: Currency[];
    is_eu?: boolean;
    latitude?: number;
    location?: {
      calling_codes?: string[];
      capital?: string;
      flag?: string;
      native_name?: string;
      top_level_domains?: string[];
    };
    longitude?: number;
    region_name?: string;
    timezones?: string[];
  }
  
  export interface Currency {
    code: string;
    name: string;
    symbol: string;
  }
  
  export type IPVersion = 4 | 6;