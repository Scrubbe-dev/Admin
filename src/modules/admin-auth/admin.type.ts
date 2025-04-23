export interface AdminPayload {
    sub: string;
    email: string;
    iat?: number;
    exp?: number;
  }
  
  export interface AdminTokenResponse {
    token: string;
  }
  
  export interface AdminProfileResponse {
    id: string;
    email: string;
    createdAt: Date;
  }

  export interface UpdatePasswordRequest {
    currentPassword: string;
    newPassword: string;
  }
  
  export interface UpdatePasswordResponse {
    id: string;
    email: string;
    createdAt: Date;
  }