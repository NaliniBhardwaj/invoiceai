export interface AuthUser {
  id: string;
  name: string;
  email: string;
  organizationId: string;
  organizationName: string;
  permissions: string[];
}

export interface AuthResponse {
  token: string;
  user: AuthUser;
}
