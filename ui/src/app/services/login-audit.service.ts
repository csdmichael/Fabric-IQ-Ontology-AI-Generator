import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';

import { environment } from '../../environments/environment';
import { LoginAuditRecord } from '../models/login-audit.model';

@Injectable({ providedIn: 'root' })
export class LoginAuditService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/api/auth/audit`;

  list() {
    return this.http.get<LoginAuditRecord[]>(this.baseUrl);
  }
}
