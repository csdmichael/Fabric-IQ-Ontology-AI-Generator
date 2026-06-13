import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { MsalService } from '@azure/msal-angular';
import { AuthenticationResult, PopupRequest } from '@azure/msal-browser';
import { firstValueFrom } from 'rxjs';

import { environment } from '../../environments/environment';
import {
  AuthSession,
  AuthenticatedUser,
  MethodResolution,
  Permission
} from '../models/auth.model';

const STORAGE_KEY = 'fabric-iq.session';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly msal = inject(MsalService);
  private readonly baseUrl = `${environment.apiUrl}/api/auth`;

  private readonly sessionSignal = signal<AuthSession | null>(this.restore());

  readonly session = this.sessionSignal.asReadonly();
  readonly user = computed<AuthenticatedUser | null>(() => this.sessionSignal()?.user ?? null);
  readonly isAuthenticated = computed(() => !!this.sessionSignal());
  readonly permissions = computed<Permission[]>(() => this.sessionSignal()?.permissions ?? []);

  hasPermission(permission: Permission): boolean {
    return this.permissions().includes(permission);
  }

  hasAnyPermission(...permissions: Permission[]): boolean {
    return permissions.some((permission) => this.hasPermission(permission));
  }

  hasRole(role: AuthenticatedUser['role']): boolean {
    return this.user()?.role === role;
  }

  token(): string | null {
    return this.sessionSignal()?.token ?? null;
  }

  resolveMethod(email: string) {
    return this.http.post<MethodResolution>(`${this.baseUrl}/method`, { email });
  }

  requestOtp(email: string) {
    return this.http.post<{ delivered: boolean; previewCode?: string }>(
      `${this.baseUrl}/otp/request`,
      { email }
    );
  }

  async loginWithOtp(email: string, code: string): Promise<AuthSession> {
    const session = await firstValueFrom(
      this.http.post<AuthSession>(`${this.baseUrl}/otp/verify`, { email, code })
    );
    this.persist(session);
    return session;
  }

  async loginWithEntra(): Promise<AuthSession> {
    const popupRequest: PopupRequest = {
      scopes: environment.auth.scopes,
      prompt: 'select_account'
    };

    const result: AuthenticationResult = await firstValueFrom(this.msal.loginPopup(popupRequest));
    if (!result.idToken) {
      throw new Error('Microsoft Entra ID returned no id_token.');
    }

    const session = await firstValueFrom(
      this.http.post<AuthSession>(`${this.baseUrl}/entra/login`, {
        idToken: result.idToken,
        accessToken: result.accessToken
      })
    );
    this.persist(session);
    return session;
  }

  refreshMe(): Promise<{ user: AuthenticatedUser; permissions: Permission[] }> {
    return firstValueFrom(
      this.http.get<{ user: AuthenticatedUser; permissions: Permission[] }>(
        `${this.baseUrl}/me`
      )
    );
  }

  logout(): void {
    const current = this.sessionSignal();
    this.sessionSignal.set(null);
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(STORAGE_KEY);
    }
    if (current?.user.method === 'entra_id') {
      this.msal.logoutPopup().subscribe({ error: () => undefined });
    }
  }

  private persist(session: AuthSession): void {
    this.sessionSignal.set(session);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    }
  }

  private restore(): AuthSession | null {
    if (typeof window === 'undefined') {
      return null;
    }
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return null;
    }
    try {
      const parsed = JSON.parse(raw) as AuthSession;
      if (new Date(parsed.expiresAt).getTime() < Date.now()) {
        window.localStorage.removeItem(STORAGE_KEY);
        return null;
      }
      return parsed;
    } catch {
      window.localStorage.removeItem(STORAGE_KEY);
      return null;
    }
  }
}
