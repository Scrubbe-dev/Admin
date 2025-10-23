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



export interface JoinPayload {
  incidentTicketId: string;
}

export interface SendMessagePayload {
  incidentTicketId: string;
  content: string;
}

export interface TypingPayload {
  incidentTicketId: string;
  isTyping: boolean;
}

export interface SocketUser {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
}

export interface Message {
  id: string;
  content: string;
  createdAt: Date;
  sender: SocketUser;
  conversationId: string;
}