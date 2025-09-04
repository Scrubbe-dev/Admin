import { AccessPermissions, Role } from "@prisma/client";

export interface InviteMemberRequest {
  inviteEmail: string;
  role: Role;
  accessPermissions: AccessPermissions[];
  Level: string; // User level/tier for escalation
}

export interface IMSSetupRequest {
  companyName: string;
  companyPurpose: string;
  inviteMembers: InviteMemberRequest[];
}

export interface IMSSetupResponse {
  success: boolean;
  message: string;
  businessId?: string;
  dashboardId?: string;
  invitesSent?: number;
  totalInvites?: number;
  domain:string;
}

export interface BusinessCreationData {
  name: string;
  companyPurpose: string;
  userId: string;
  industry?: string;
  primaryRegion?: string;
}

export interface InviteCreationData {
  email: string;
  role: Role;
  accessPermissions: AccessPermissions[];
  sentById: string;
  Level: string;
  firstName?: string;
  lastName?: string;
}