import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';

import { environment } from '../../environments/environment';

export interface FabricConnectionSettings {
  workspaceId: string;
  capacityId: string;
  clientId: string;
  clientSecret: string;
  tenantId: string;
  storageContainer: string;
  storageConnectionString: string;
}

export interface DataSourceConnection {
  id: string;
  name: string;
  type: 'lakehouse' | 'warehouse' | 'sql-endpoint' | 'view';
  workspaceId: string;
  itemName: string;
}

@Injectable({
  providedIn: 'root'
})
export class DatasourceService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/api/datasources`;

  listDataSources() {
    return this.http.get<DataSourceConnection[]>(this.baseUrl);
  }

  createDataSource(payload: Omit<DataSourceConnection, 'id'>) {
    return this.http.post<DataSourceConnection>(this.baseUrl, payload);
  }

  getSettings() {
    return this.http.get<FabricConnectionSettings>(`${this.baseUrl}/config`);
  }

  saveSettings(payload: FabricConnectionSettings) {
    return this.http.put<FabricConnectionSettings>(`${this.baseUrl}/config`, payload);
  }
}
