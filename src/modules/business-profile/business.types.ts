import { AccountType, Priority, Role } from "@prisma/client";

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
  defaultDashboard: DashboardType;
  prefferedIntegration: PrefferedIntegration[];
  notificationChannels: NotificationChannels[];
  defaultPriority: Priority[];
}

export interface InviteMembers {
  firstName: string;
  lastName: string;
  inviteEmail: string;
  role: Role;
  accessPermissions: AccessPermissions[];
}

export enum AccessPermissions {
  VIEW_DASHBOARD = "VIEW_DASHBOARD",
  MODIFY_DASHBOARD = "MODIFY_DASHBOARD",
  EXECUTE_ACTIONS = "EXECUTE_ACTIONS",
  MANAGE_USERS = "MANAGE_USERS",

}

export enum DashboardType {
  SCRUBBE_DASHBOARD_SIEM = "SCRUBBE_DASHBOARD_SIEM",
  SCRUBBE_DASHBOARD_SOUR = "SCRUBBE_DASHBOARD_SOUR",
  CUSTOM = "CUSTOM",
}

export enum PrefferedIntegration {
  JIRA = "JIRA",
  FRESH_DESK = "FRESH_DESK",
  SERVICE_NOW = "SERVICE_NOW",
}

export enum NotificationChannels {
  SLACK = "SLACK",
  MICROSOFT_TEAMS = "MICROSOFT_TEAMS",
  EMAIL = "EMAIL",
  SMS = "SMS",
}

// export interface SignedPayload {
//   inviteId?:string;
//   email: string;
//   firstName?: string;
//   lastName?: string;
//   role?:string;
//   accessPermissions?:string;
//   level?: string,
//   workspaceName?: string, // Business name from sentById
//   businessId?: string
// }

export interface DecodeInviteTokenResult {
  existingUser: boolean;
  inviteData: SignedPayload;
}

export interface DecodeInvite{
  token: string;
}

export interface Members {
  firstname: string | null;
  lastname: string | null;
  email: string | null;
  isOwner?: boolean;
}


export interface SignedPayload {
  inviteId?: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role?: Role;
  accessPermissions?: AccessPermissions[];
  level?: string;
  workspaceName?: string;
  businessId?: string;
}

export interface AcceptInviteRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  businessId: string;
}


export interface IUserdata {
    id: string;
    sub: string;
    firstName: string;
    lastName: string;
    email: string;
    accountType?: AccountType ;
    businessId?: string;
    scopes?: string[];
}


export type AcceptInviteTypes = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  businessId: string;
};

// businessId: "f0f0829c-f5bc-48b1-8831-8871bda36eeb"
// email: "sanivi6981@fixwap.com"
// firstName: "micheal"
// lastName: "fred"
// password: "Goodboy2"