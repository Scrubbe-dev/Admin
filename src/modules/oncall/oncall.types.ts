export interface OnCallTeamMember {
  member: string;
  startTime: string;
  endTime: string;
}

export interface CreateOnCallAssignmentRequest {
  startDate: string;
  endDate: string;
  teamMembers: OnCallTeamMember[];
}

export interface OnCallAssignmentResponse {
  id: string;
  startDate: string;
  endDate: string;
  status: string;
  teamMembers: Array<{
    id: string;
    member: {
      id: string;
      email: string;
      firstName: string | null;
      lastName: string | null;
    };
    startTime: string;
    endTime: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}