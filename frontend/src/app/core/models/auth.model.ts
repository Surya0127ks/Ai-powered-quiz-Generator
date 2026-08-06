export enum UserRole {
  SuperAdmin = 0,
  TenantAdmin = 1,
  Instructor = 2,
  Student = 3
}

export interface User {
  id: string;
  tenantId: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  isActive: boolean;
  createdAtUtc: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  expiresAtUtc: string;
  user: User;
}

export interface LoginRequest {
  email: string;
  password: string;
  tenantIdentifier?: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  tenantName: string;
  tenantIdentifier: string;
  role?: UserRole;
}

export interface RefreshTokenRequest {
  accessToken: string;
  refreshToken: string;
}
