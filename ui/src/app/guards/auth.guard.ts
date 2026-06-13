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

export const authGuard: CanActivateFn = (_route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (auth.isAuthenticated()) {
    return true;
  }
  router.navigate(['/login'], { queryParams: { redirect: state.url } });
  return false;
};

export const roleGuard: CanActivateFn = (route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (!auth.isAuthenticated()) {
    router.navigate(['/login'], { queryParams: { redirect: state.url } });
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
