import { UserRole } from '../types/auth.types';

/**
 * Role hierarchy: a higher role inherits all the permissions of the roles below it.
 * The order is meaningful — index 0 = lowest privilege, last = highest privilege.
 */
export const ROLE_HIERARCHY: UserRole[] = ['guest', 'business_user', 'it_user', 'admin', 'app_owner'];

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

const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  guest: [
    'ontology:read',
    'datasource:read'
  ],
  business_user: [
    'ontology:read',
    'ontology:create',
    'ontology:edit',
    'ontology:submit-for-binding',
    'agent:ontology-generator'
  ],
  it_user: [
    'ontology:read',
    'ontology:edit',
    'ontology:bind-data',
    'ontology:submit-for-deployment',
    'datasource:read',
    'datasource:configure',
    'agent:ontology-data-binder'
  ],
  admin: [
    'ontology:read',
    'ontology:create',
    'ontology:edit',
    'ontology:submit-for-binding',
    'ontology:bind-data',
    'ontology:submit-for-deployment',
    'ontology:deploy-to-fabric',
    'datasource:read',
    'datasource:configure',
    'agent:ontology-generator',
    'agent:ontology-data-binder',
    'users:read'
  ],
  app_owner: [
    'ontology:read',
    'ontology:create',
    'ontology:edit',
    'ontology:submit-for-binding',
    'ontology:bind-data',
    'ontology:submit-for-deployment',
    'ontology:deploy-to-fabric',
    'datasource:read',
    'datasource:configure',
    'agent:ontology-generator',
    'agent:ontology-data-binder',
    'users:read',
    'users:manage'
  ]
};

export const hasPermission = (role: UserRole, permission: Permission): boolean => {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
};

export const roleAtLeast = (role: UserRole, minimum: UserRole): boolean => {
  return ROLE_HIERARCHY.indexOf(role) >= ROLE_HIERARCHY.indexOf(minimum);
};

export const permissionsForRole = (role: UserRole): Permission[] => ROLE_PERMISSIONS[role] ?? [];
