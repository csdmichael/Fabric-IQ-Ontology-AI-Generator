import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import {
  IonButton,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardSubtitle,
  IonCardTitle,
  IonContent,
  IonInput,
  IonItem,
  IonLabel,
  IonNote,
  IonSegment,
  IonSegmentButton,
  IonSpinner
} from '@ionic/angular/standalone';

import { AuthMethod } from '../../models/auth.model';
import { AuthService } from '../../services/auth.service';

type LoginStage = 'email' | 'otp' | 'entra';

@Component({
  selector: 'app-login-page',
  standalone: true,
  templateUrl: './login.page.html',
  imports: [
    FormsModule,
    IonContent,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardSubtitle,
    IonCardContent,
    IonItem,
    IonLabel,
    IonInput,
    IonButton,
    IonNote,
    IonSegment,
    IonSegmentButton,
    IonSpinner
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LoginPage {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly email = signal('');
  readonly code = signal('');
  readonly stage = signal<LoginStage>('email');
  readonly method = signal<AuthMethod>('otp');
  readonly busy = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly infoMessage = signal<string | null>(null);
  readonly previewCode = signal<string | null>(null);

  async resolveMethod(): Promise<void> {
    const email = this.email().trim().toLowerCase();
    if (!email) {
      this.errorMessage.set('Please enter your email address.');
      return;
    }
    this.busy.set(true);
    this.errorMessage.set(null);
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

  private callPromise<T>(observable: { subscribe: (...args: unknown[]) => unknown }): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      (observable as unknown as import('rxjs').Observable<T>).subscribe({
        next: (value) => resolve(value),
        error: (err) => reject(err)
      });
    });
  }
}
