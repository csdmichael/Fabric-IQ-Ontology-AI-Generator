export type UserRole = 'business_user' | 'it_user' | 'admin' | 'app_owner';

export type AuthMethod = 'otp' | 'entra_id';

export interface AuthenticatedUser {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
  authMethod: AuthMethod;
}

export interface SessionToken {
  token: string;
  expiresAt: string;
  user: AuthenticatedUser;
}

export interface OtpRequestBody {
  email: string;
}

export interface OtpVerifyBody {
  email: string;
  code: string;
}

export interface EntraLoginBody {
  idToken: string;
  accessToken?: string;
}

export interface JwtClaims {
  sub: string;
  email: string;
  role: UserRole;
  method: AuthMethod;
  name: string;
  iat?: number;
  exp?: number;
  iss?: string;
  aud?: string;
}
