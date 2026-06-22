import { environment } from '../config/environment';
import { DataSource, FabricConfig } from '../types/datasource.types';

export class FabricService {
  private config: FabricConfig = {
    workspaceId: environment.fabricWorkspaceId,
    capacityId: environment.fabricCapacityId,
    clientId: environment.fabricClientId,
    clientSecret: environment.fabricClientSecret,
    tenantId: environment.fabricTenantId,
    storageContainer: environment.storageContainer,
    storageConnectionString: environment.storageConnectionString
  };

  private readonly sources: DataSource[] = [
    {
      id: 'sales-lakehouse-customers',
      name: 'Sales Lakehouse Customers',
      type: 'lakehouse',
      workspaceId: environment.fabricWorkspaceId || 'local-workspace',
      itemName: 'sales_customers'
    },
    {
      id: 'support-view-tickets',
      name: 'Support View Tickets',
      type: 'view',
      workspaceId: environment.fabricWorkspaceId || 'local-workspace',
      itemName: 'vw_support_tickets'
    },
    {
      id: 'part-shortages-lakehouse-v2',
      name: 'Part Shortages v2',
      type: 'lakehouse',
      workspaceId: '2b2c447d-86e1-4982-a5b6-09d2e0f3482d',
      itemName: 'lh_part_shortages_v2'
    }
  ];

  async listDataSources(): Promise<DataSource[]> {
    return this.sources;
  }

  async getConfig(): Promise<FabricConfig> {
    return this.config;
  }

  async updateConfig(config: FabricConfig): Promise<FabricConfig> {
    this.config = { ...config };
    return this.config;
  }
}
