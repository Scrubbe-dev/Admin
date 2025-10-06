export interface OnCallTeamMember {
  member: string;
  startTime: string;
  endTime: string;
}

export interface CreateOnCallAssignmentRequest {
  date: string; // Single date instead of startDate/endDate
  teamMembers: OnCallTeamMember[];
}

export interface OnCallAssignmentResponse {
  id: string;
  date: string; // Single date
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

export interface GetAllAssignmentsResponse {
  date: string;
  teamMembers: Array<{
    member: string;
    startTime: string;
    endTime: string;
  }>;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}