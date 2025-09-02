import { AccessPermissions, Role } from "@prisma/client";

export interface InviteMemberRequest {
  inviteEmail: string;
  role: Role;
  accessPermissions: AccessPermissions[];
  Level: string; // User level/tier for escalation
}

export interface IMSSetupRequest {
  companyName: string;
  companySize: string;
  inviteMembers: InviteMemberRequest[];
}

export interface IMSSetupResponse {
  success: boolean;
  message: string;
  businessId?: string;
  dashboardId?: string;
  invitesSent?: number;
  totalInvites?: number;
}

export interface BusinessCreationData {
  name: string;
  companySize: string;
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