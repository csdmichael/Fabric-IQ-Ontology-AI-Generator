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

  async getDataSourceById(id: string): Promise<DataSource | undefined> {
    return this.sources.find((source) => source.id === id);
  }

  async createDataSource(payload: Omit<DataSource, 'id'>): Promise<DataSource> {
    const slug = payload.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    const dataSource: DataSource = {
      id: `${slug || 'datasource'}-${Date.now()}`,
      name: payload.name,
      type: payload.type,
      workspaceId: payload.workspaceId || this.config.workspaceId || 'local-workspace',
      itemName: payload.itemName
    };
    this.sources.push(dataSource);
    return dataSource;
  }

  async getConfig(): Promise<FabricConfig> {
    return this.config;
  }

  async updateConfig(config: FabricConfig): Promise<FabricConfig> {
    this.config = { ...config };
    return this.config;
  }
}
