import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { MsalService } from '@azure/msal-angular';
import {
  AuthenticationResult,
  RedirectRequest
} from '@azure/msal-browser';
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

  async initialize(): Promise<void> {
    await this.msal.instance.initialize();

    const redirectResult = await this.msal.instance.handleRedirectPromise();
    if (redirectResult) {
      await this.completeEntraSignIn(redirectResult);
      return;
    }

    const accounts = this.msal.instance.getAllAccounts();
    if (!this.msal.instance.getActiveAccount() && accounts.length > 0) {
      this.msal.instance.setActiveAccount(accounts[0]);
    }
  }

  async loginWithEntra(loginHint?: string): Promise<AuthSession | null> {
    const normalizedHint = loginHint?.trim().toLowerCase();
    await this.redirectToEntraLogin(normalizedHint);
    return null;
  }

  async loginAsGuest(): Promise<AuthSession> {
    const session = await firstValueFrom(
      this.http.post<AuthSession>(`${this.baseUrl}/guest`, {})
    );
    this.persist(session);
    return session;
  }

  /** Internal Entra-ID-eligible domains, surfaced to the login page as quick-pick chips. */
  internalDomains(): string[] {
    const list = (environment.auth as { internalDomains?: string[] }).internalDomains;
    if (list && list.length > 0) {
      return list.map((d) => d.replace(/^@/, '').toLowerCase());
    }
    const fallback = environment.auth.allowedDomain?.replace(/^@/, '').toLowerCase();
    return fallback ? [fallback] : [];
  }

  isInternalEmail(email: string): boolean {
    const normalized = email.trim().toLowerCase();
    if (!normalized.includes('@')) return false;
    const domain = normalized.split('@')[1] ?? '';
    return this.internalDomains().some((d) => domain === d);
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
    if (current?.user.authMethod === 'entra_id') {
      void this.msal.instance.logoutRedirect();
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

  private async completeEntraSignIn(result: AuthenticationResult): Promise<AuthSession> {
    if (!result.idToken) {
      throw new Error('Microsoft Entra ID returned no id_token.');
    }

    this.msal.instance.setActiveAccount(result.account);
    const session = await firstValueFrom(
      this.http.post<AuthSession>(`${this.baseUrl}/entra/login`, {
        idToken: result.idToken,
        accessToken: result.accessToken
      })
    );
    this.persist(session);
    return session;
  }

  private async redirectToEntraLogin(loginHint?: string): Promise<void> {
    const redirectRequest: RedirectRequest = {
      scopes: environment.auth.scopes,
      prompt: 'select_account',
      loginHint
    };
    await this.msal.instance.loginRedirect(redirectRequest);
  }
}
