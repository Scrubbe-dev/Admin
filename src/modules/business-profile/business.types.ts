import { Priority } from "@prisma/client";
import { Role } from "../auth/types/auth.types";

export interface BusinessSetUpRequest {
  companyName: string;
  industry: string;
  companySize: string;
  primaryRegion: string;
  companyLogo?: string;

  // for business admin
  firstName: string; // The person that signed up with company email
  lastName: string;
  adminEmail: string;
  adminJobTitle: string;

  //invite team members
  inviteMembers?: InviteMembers[];

  dashboardPreference?: DashBoardPreference;
}

export interface DashBoardPreference {
  colorScheme: string;
  defaultDashboard: string;
  prefferedIntegration: PrefferedIntegration;
  notificationChannels: NotificationChannels;
  defaultPriority: Priority;
}

export interface InviteMembers {
  firstName: string;
  lastName: string;
  email: string;
  role: Role;
  accessPermisions: AccessPermissions[];
}

export enum AccessPermissions {
  VIEW_DASHBOARD,
  MODIFY_DASHBOARD,
  EXECUTE_ACTIONS,
  MANAGE_USERS,
}

export enum DashboardType {
  SCRUBBE_DASHBOARD_SIEM,
  SCRUBBE_DASHBOARD_SOUR,
  CUSTOM,
}

export enum PrefferedIntegration {
  JIRA,
  FRESH_DESK,
  SERVICE_NOW,
}

export enum NotificationChannels {
  JIRA,
  FRESH_DESK,
  SERVICE_NOW,
}
