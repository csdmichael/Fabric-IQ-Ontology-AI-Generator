import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { Permission, UserRole } from '../models/auth.model';
import { AuthService } from '../services/auth.service';

const ROLE_RANK: Record<UserRole, number> = {
  guest: 0,
  business_user: 1,
  it_user: 2,
  admin: 3,
  app_owner: 4
};

const OAUTH_CALLBACK_PATTERN = /(^|[#?&])(code|id_token|access_token|error)=/i;

export const authGuard: CanActivateFn = (_route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  // Allow OAuth callback responses (code/id_token/error in URL hash) to flow through
  // so AuthService/MSAL can complete redirect processing instead of bouncing to /login.
  if (typeof window !== 'undefined') {
    const hash = window.location.hash ?? '';
    const hasAuthCallbackHash = /(^|[&#])(code|id_token|access_token|error)=/.test(hash);
    if (hasAuthCallbackHash) {
      return true;
    }
  }

  if (auth.isAuthenticated()) {
    return true;
  }

  const redirect = sanitizeRedirectTarget(state.url);
  router.navigate(['/login'], { queryParams: { redirect } });
  return false;
};

export const roleGuard: CanActivateFn = (route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (!auth.isAuthenticated()) {
    const redirect = sanitizeRedirectTarget(state.url);
    router.navigate(['/login'], { queryParams: { redirect } });
    return false;
  }

  const data = route.data ?? {};
  const minRole = data['minRole'] as UserRole | undefined;
  const anyPermissions = (data['anyPermissions'] as Permission[] | undefined) ?? [];

  if (minRole) {
    const userRank = ROLE_RANK[auth.user()!.role];
    if (userRank < ROLE_RANK[minRole]) {
      router.navigate(['/']);
      return false;
    }
  }

  if (anyPermissions.length && !auth.hasAnyPermission(...anyPermissions)) {
    router.navigate(['/']);
    return false;
  }

  return true;
};

function sanitizeRedirectTarget(target: string | null | undefined): string {
  if (!target) {
    return '/';
  }

  let normalized = target.trim();
  if (!normalized) {
    return '/';
  }

  for (let i = 0; i < 2; i += 1) {
    try {
      const decoded = decodeURIComponent(normalized);
      if (decoded === normalized) {
        break;
      }
      normalized = decoded;
    } catch {
      break;
    }
  }

  if (!normalized.startsWith('/')) {
    return '/';
  }

  if (OAUTH_CALLBACK_PATTERN.test(normalized)) {
    return '/';
  }

  return normalized;
}
