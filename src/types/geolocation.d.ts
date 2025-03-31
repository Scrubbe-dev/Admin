// Full type definitions
interface ApiResponse<T> {
    data: T;
    status: number;
    headers: Headers;
  }
  
  export interface IPGeoResponse {
    ip: string;
    type: 'ipv4' | 'ipv6';
    city?: string;
    continent_code?: string;
    continent_name?: string;
    country_code?: string;
    country_name?: string;
    region_name?: string;
    latitude?: number;
    longitude?: number;
    is_eu?: boolean;
    connection?: {
      asn?: number;
      isp?: string;
    };
    currencies?: Currency[];
    location?: {
      capital?: string;
      flag?: string;
      native_name?: string;
      calling_codes?: string[];
      top_level_domains?: string[];
    };
    timezones?: string[];
  }
  
  interface Currency {
    code: string;
    name: string;
    symbol: string;
  }
  
