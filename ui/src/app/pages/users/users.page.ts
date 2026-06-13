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
  IonToggle
} from '@ionic/angular/standalone';

import { AuthMethod, UserRole } from '../../models/auth.model';
import { UserRecord, UserUpsertInput } from '../../models/user.model';
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
    IonNote
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UsersPage implements OnInit {
  private readonly users = inject(UserService);

  readonly roles: UserRole[] = ['business_user', 'it_user', 'admin', 'app_owner'];
  readonly methods: AuthMethod[] = ['otp', 'entra_id'];

  readonly records = signal<UserRecord[]>([]);
  readonly busy = signal(false);
  readonly error = signal<string | null>(null);

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
}
