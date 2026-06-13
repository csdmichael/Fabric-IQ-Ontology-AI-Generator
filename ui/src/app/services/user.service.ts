import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';

import { environment } from '../../environments/environment';
import { UserRecord, UserUpsertInput } from '../models/user.model';

@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/api/users`;

  list() {
    return this.http.get<UserRecord[]>(this.baseUrl);
  }

  create(input: UserUpsertInput) {
    return this.http.post<UserRecord>(this.baseUrl, input);
  }

  update(id: string, input: Partial<UserUpsertInput>) {
    return this.http.put<UserRecord>(`${this.baseUrl}/${id}`, input);
  }

  remove(id: string) {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
