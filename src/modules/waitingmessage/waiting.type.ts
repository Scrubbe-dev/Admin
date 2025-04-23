import { WaitingUser, Role } from '@prisma/client';

export interface WaitingUserResponse extends Omit<WaitingUser, 'updatedAt'> {
  // Add any additional response fields if needed
}

export interface CreateWaitingUserRequest {
  fullName: string;
  email: string;
  company: string;
  role: Role;
  message?: string;
}

export interface WaitingListResponse {
  data: WaitingUserResponse[];
  count: number;
}