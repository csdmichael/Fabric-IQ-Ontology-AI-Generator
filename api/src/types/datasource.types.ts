export type DataSourceType = 'lakehouse' | 'warehouse' | 'sql-endpoint' | 'view';

export interface DataSource {
  id: string;
  name: string;
  type: DataSourceType;
  workspaceId: string;
  itemName: string;
}

export interface FabricConfig {
  workspaceId: string;
  capacityId: string;
  clientId: string;
  clientSecret: string;
  tenantId: string;
  storageContainer: string;
  storageConnectionString: string;
}
