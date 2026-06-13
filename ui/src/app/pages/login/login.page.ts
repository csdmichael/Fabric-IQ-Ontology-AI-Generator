import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { firstValueFrom, Observable } from 'rxjs';
import {
  IonButton,
  IonContent,
  IonIcon,
  IonInput,
  IonNote,
  IonSpinner
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  keyOutline,
  logoMicrosoft,
  mailOutline,
  paperPlaneOutline,
  personOutline,
  refreshOutline,
  shieldCheckmarkOutline,
  sparklesOutline
} from 'ionicons/icons';

import { environment } from '../../../environments/environment';
import { AuthMethod } from '../../models/auth.model';
import { AuthService } from '../../services/auth.service';

type LoginStage = 'email' | 'otp' | 'entra';

@Component({
  selector: 'app-login-page',
  standalone: true,
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  imports: [
    CommonModule,
    FormsModule,
    IonContent,
    IonInput,
    IonButton,
    IonNote,
    IonSpinner,
    IonIcon
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LoginPage {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly systemName =
    (environment as { branding?: { systemName?: string } }).branding?.systemName ??
    'Fabric IQ Ontology AI Generator';
  readonly shortName =
    (environment as { branding?: { shortName?: string } }).branding?.shortName ?? 'Fabric IQ';
  readonly tagline =
    (environment as { branding?: { tagline?: string } }).branding?.tagline ??
    'Design, bind, and ship business ontologies for Microsoft Fabric.';
  readonly supportEmail =
    (environment as { branding?: { supportEmail?: string } }).branding?.supportEmail ?? '';

  readonly email = signal('');
  readonly code = signal('');
  readonly stage = signal<LoginStage>('email');
  readonly method = signal<AuthMethod>('otp');
  readonly busy = signal(false);
  readonly guestBusy = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly infoMessage = signal<string | null>(null);
  readonly previewCode = signal<string | null>(null);

  readonly domainHelpers = computed<string[]>(() => this.auth.internalDomains());

  readonly highlights = [
    {
      icon: 'sparkles-outline',
      title: 'AI-generated ontologies',
      description: 'Describe your domain; Foundry agents propose entities and relationships.'
    },
    {
      icon: 'shield-checkmark-outline',
      title: 'Governed access',
      description: 'Entra ID for staff, one-time codes for partners, guest read-only for everyone else.'
    },
    {
      icon: 'sparkles-outline',
      title: 'Ship to Fabric',
      description: 'Bind data, validate, and deploy ontologies straight into your Fabric workspace.'
    }
  ];

  readonly requestAccessMailto = computed<string>(() => {
    const to = this.supportEmail;
    if (!to) return '';
    const subject = encodeURIComponent(`Access request: ${this.systemName}`);
    const account = this.email().trim() || '<your work email>';
    const body = encodeURIComponent(
      `Hello,\n\nPlease grant me access to ${this.systemName}.\n\nWork email: ${account}\n\nThank you.`
    );
    return `mailto:${to}?subject=${subject}&body=${body}`;
  });

  constructor() {
    addIcons({
      mailOutline,
      keyOutline,
      logoMicrosoft,
      paperPlaneOutline,
      personOutline,
      refreshOutline,
      shieldCheckmarkOutline,
      sparklesOutline
    });
  }

  applyDomain(domain: string): void {
    const normalized = domain.replace(/^@/, '').trim().toLowerCase();
    if (!normalized) return;
    const value = this.email().trim().toLowerCase();
    const atIndex = value.indexOf('@');
    if (!value) {
      this.email.set(`@${normalized}`);
      return;
    }
    if (atIndex < 0) {
      this.email.set(`${value}@${normalized}`);
      return;
    }
    const local = value.slice(0, atIndex);
    this.email.set(local ? `${local}@${normalized}` : `@${normalized}`);
  }

  async resolveMethod(): Promise<void> {
    const email = this.email().trim().toLowerCase();
    if (!email || !email.includes('@')) {
      this.errorMessage.set('Please enter a valid work email address.');
      return;
    }
    this.email.set(email);
    this.busy.set(true);
    this.errorMessage.set(null);
    this.infoMessage.set(null);
    try {
      const resolution = await this.callPromise(this.auth.resolveMethod(email));
      this.method.set(resolution.method);
      this.stage.set(resolution.method === 'entra_id' ? 'entra' : 'otp');
      if (resolution.method === 'otp') {
        const result = await this.callPromise(this.auth.requestOtp(email));
        this.previewCode.set(result.previewCode ?? null);
        this.infoMessage.set(
          result.delivered
            ? `We sent a one-time code to ${email}. Check your inbox.`
            : `If ${email} is registered, you will receive a code shortly.`
        );
      } else {
        this.infoMessage.set(
          `Sign in with your Microsoft Entra ID account (${email}) using the popup.`
        );
      }
    } catch (error) {
      this.errorMessage.set(this.toMessage(error));
    } finally {
      this.busy.set(false);
    }
  }

  async verifyOtp(): Promise<void> {
    const email = this.email().trim().toLowerCase();
    const code = this.code().trim();
    if (!code) {
      this.errorMessage.set('Enter the code from your email.');
      return;
    }
    this.busy.set(true);
    this.errorMessage.set(null);
    try {
      await this.auth.loginWithOtp(email, code);
      this.navigateAfterLogin();
    } catch (error) {
      this.errorMessage.set(this.toMessage(error));
    } finally {
      this.busy.set(false);
    }
  }

  async loginWithEntra(): Promise<void> {
    this.busy.set(true);
    this.errorMessage.set(null);
    try {
      await this.auth.loginWithEntra();
      this.navigateAfterLogin();
    } catch (error) {
      this.errorMessage.set(this.toMessage(error));
    } finally {
      this.busy.set(false);
    }
  }

  async continueAsGuest(): Promise<void> {
    this.errorMessage.set(null);
    this.guestBusy.set(true);
    try {
      await this.auth.loginAsGuest();
      this.navigateAfterLogin();
    } catch (error) {
      this.errorMessage.set(this.toMessage(error));
    } finally {
      this.guestBusy.set(false);
    }
  }

  switchMethod(method: AuthMethod): void {
    this.method.set(method);
    this.stage.set(method === 'entra_id' ? 'entra' : 'otp');
  }

  reset(): void {
    this.stage.set('email');
    this.code.set('');
    this.errorMessage.set(null);
    this.infoMessage.set(null);
    this.previewCode.set(null);
  }

  private navigateAfterLogin(): void {
    const redirect = this.route.snapshot.queryParamMap.get('redirect') ?? '/';
    this.router.navigateByUrl(redirect);
  }

  private toMessage(error: unknown): string {
    if (error && typeof error === 'object' && 'error' in error) {
      const inner = (error as { error?: { message?: string } }).error;
      if (inner?.message) return inner.message;
    }
    if (error instanceof Error) return error.message;
    return 'Sign-in failed. Please try again.';
  }

  private callPromise<T>(observable: Observable<T>): Promise<T> {
    return firstValueFrom(observable);
  }
}
