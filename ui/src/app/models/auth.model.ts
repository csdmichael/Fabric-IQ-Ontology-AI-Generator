export type UserRole = 'guest' | 'business_user' | 'it_user' | 'admin' | 'app_owner';
export type AuthMethod = 'otp' | 'entra_id' | 'guest';

export type Permission =
  | 'ontology:read'
  | 'ontology:create'
  | 'ontology:edit'
  | 'ontology:submit-for-binding'
  | 'ontology:bind-data'
  | 'ontology:submit-for-deployment'
  | 'ontology:deploy-to-fabric'
  | 'datasource:read'
  | 'datasource:configure'
  | 'agent:ontology-generator'
  | 'agent:ontology-data-binder'
  | 'users:read'
  | 'users:manage';

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

export interface AuthSession extends SessionToken {
  permissions: Permission[];
}

export interface MethodResolution {
  email: string;
  method: AuthMethod;
  exists: boolean;
}
