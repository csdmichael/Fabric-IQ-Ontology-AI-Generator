import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  IonButton,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonContent,
  IonInput,
  IonItem,
  IonLabel,
  IonList,
  IonNote,
  IonSelect,
  IonSelectOption,
  IonSpinner,
  IonText,
  IonToggle
} from '@ionic/angular/standalone';

import { AuthMethod, UserRole } from '../../models/auth.model';
import { LoginAuditRecord } from '../../models/login-audit.model';
import { UserRecord, UserUpsertInput } from '../../models/user.model';
import { LoginAuditService } from '../../services/login-audit.service';
import { UserService } from '../../services/user.service';

@Component({
  selector: 'app-users-page',
  standalone: true,
  templateUrl: './users.page.html',
  imports: [
    FormsModule,
    IonContent,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonItem,
    IonLabel,
    IonInput,
    IonSelect,
    IonSelectOption,
    IonButton,
    IonList,
    IonToggle,
    IonSpinner,
    IonNote,
    IonText
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UsersPage implements OnInit {
  private readonly users = inject(UserService);
  private readonly loginAudit = inject(LoginAuditService);

  readonly roles: UserRole[] = ['business_user', 'it_user', 'admin', 'app_owner'];
  readonly methods: AuthMethod[] = ['otp', 'entra_id'];

  readonly records = signal<UserRecord[]>([]);
  readonly auditRecords = signal<LoginAuditRecord[]>([]);
  readonly busy = signal(false);
  readonly auditBusy = signal(false);
  readonly error = signal<string | null>(null);
  readonly auditError = signal<string | null>(null);

  readonly draft = signal<UserUpsertInput>({
    email: '',
    displayName: '',
    role: 'business_user',
    authMethod: 'entra_id',
    enabled: true
  });

  ngOnInit(): void {
    this.reload();
  }

  reload(): void {
    this.reloadUsers();
    this.reloadAudit();
  }

  reloadUsers(): void {
    this.busy.set(true);
    this.error.set(null);
    this.users.list().subscribe({
      next: (records) => {
        this.records.set(records);
        this.busy.set(false);
      },
      error: (err: { message?: string }) => {
        this.error.set(err?.message ?? 'Unable to load users.');
        this.busy.set(false);
      }
    });
  }

  reloadAudit(): void {
    this.auditBusy.set(true);
    this.auditError.set(null);
    this.loginAudit.list().subscribe({
      next: (records) => {
        this.auditRecords.set(records);
        this.auditBusy.set(false);
      },
      error: (err: { error?: { message?: string } }) => {
        this.auditError.set(err?.error?.message ?? 'Unable to load login audit history.');
        this.auditBusy.set(false);
      }
    });
  }

  patchDraft(patch: Partial<UserUpsertInput>): void {
    this.draft.update((current) => ({ ...current, ...patch }));
  }

  create(): void {
    const payload = this.draft();
    if (!payload.email || !payload.displayName) {
      this.error.set('Email and display name are required.');
      return;
    }
    this.busy.set(true);
    this.users.create(payload).subscribe({
      next: () => {
        this.draft.set({
          email: '',
          displayName: '',
          role: 'business_user',
          authMethod: 'entra_id',
          enabled: true
        });
        this.reload();
      },
      error: (err: { error?: { message?: string } }) => {
        this.error.set(err?.error?.message ?? 'Failed to create user.');
        this.busy.set(false);
      }
    });
  }

  update(record: UserRecord, patch: Partial<UserUpsertInput>): void {
    this.users.update(record.id, patch).subscribe({
      next: () => this.reload(),
      error: (err: { error?: { message?: string } }) =>
        this.error.set(err?.error?.message ?? 'Failed to update user.')
    });
  }

  remove(record: UserRecord): void {
    if (!confirm(`Remove ${record.email}?`)) return;
    this.users.remove(record.id).subscribe({
      next: () => this.reload(),
      error: (err: { error?: { message?: string } }) =>
        this.error.set(err?.error?.message ?? 'Failed to remove user.')
    });
  }

  auditSecondary(record: LoginAuditRecord): string {
    const pieces = [
      record.email,
      record.role,
      record.ipAddress,
      record.userAgent
    ].filter(Boolean);
    return pieces.join(' · ');
  }

  formatTimestamp(value: string): string {
    return new Date(value).toLocaleString();
  }

  formatMethod(method: LoginAuditRecord['method']): string {
    switch (method) {
      case 'entra_id':
        return 'Microsoft Entra ID';
      case 'guest':
        return 'Guest access';
      default:
        return 'Email code';
    }
  }
}
