############################################
# Cosmos DB (private) — users, ontologies, audit
############################################

resource "azurerm_cosmosdb_account" "cosmos" {
  name                          = local.cosmos_account_name
  resource_group_name           = local.rg_name
  location                      = local.loc
  offer_type                    = "Standard"
  kind                          = "GlobalDocumentDB"
  public_network_access_enabled = false
  tags                          = local.tags

  consistency_policy {
    consistency_level = "Session"
  }

  geo_location {
    location          = local.loc
    failover_priority = 0
  }

  capabilities {
    name = "EnableServerless"
  }

  backup {
    type = "Continuous"
    tier = "Continuous7Days"
  }
}

resource "azurerm_cosmosdb_sql_database" "db" {
  name                = "fabriciq"
  resource_group_name = local.rg_name
  account_name        = azurerm_cosmosdb_account.cosmos.name
}

resource "azurerm_cosmosdb_sql_container" "users" {
  name                = "users"
  resource_group_name = local.rg_name
  account_name        = azurerm_cosmosdb_account.cosmos.name
  database_name       = azurerm_cosmosdb_sql_database.db.name
  partition_key_paths = ["/email"]
}

resource "azurerm_cosmosdb_sql_container" "ontologies" {
  name                = "ontologies"
  resource_group_name = local.rg_name
  account_name        = azurerm_cosmosdb_account.cosmos.name
  database_name       = azurerm_cosmosdb_sql_database.db.name
  partition_key_paths = ["/id"]
}

resource "azurerm_cosmosdb_sql_container" "audit" {
  name                = "audit"
  resource_group_name = local.rg_name
  account_name        = azurerm_cosmosdb_account.cosmos.name
  database_name       = azurerm_cosmosdb_sql_database.db.name
  partition_key_paths = ["/ontologyId"]
}

resource "azurerm_private_endpoint" "cosmos_pe" {
  name                = "pe-${azurerm_cosmosdb_account.cosmos.name}"
  location            = local.loc
  resource_group_name = local.rg_name
  subnet_id           = azurerm_subnet.snet_pe.id
  tags                = local.tags

  private_service_connection {
    name                           = "cosmos"
    private_connection_resource_id = azurerm_cosmosdb_account.cosmos.id
    is_manual_connection           = false
    subresource_names              = ["Sql"]
  }

  private_dns_zone_group {
    name                 = "cosmos"
    private_dns_zone_ids = [azurerm_private_dns_zone.zone["cosmos"].id]
  }
}

############################################
# Storage account (existing) + private endpoint
############################################

data "azurerm_storage_account" "ai_storage" {
  name                = local.storage_account
  resource_group_name = local.rg_name
}

resource "azurerm_storage_container" "fabric_ontologies" {
  name                  = local.storage_container
  storage_account_name  = data.azurerm_storage_account.ai_storage.name
  container_access_type = "private"
}

resource "azurerm_private_endpoint" "storage_pe" {
  name                = "pe-${data.azurerm_storage_account.ai_storage.name}-blob"
  location            = local.loc
  resource_group_name = local.rg_name
  subnet_id           = azurerm_subnet.snet_pe.id
  tags                = local.tags

  private_service_connection {
    name                           = "storage-blob"
    private_connection_resource_id = data.azurerm_storage_account.ai_storage.id
    is_manual_connection           = false
    subresource_names              = ["blob"]
  }

  private_dns_zone_group {
    name                 = "storage"
    private_dns_zone_ids = [azurerm_private_dns_zone.zone["blob"].id]
  }
}

############################################
# Azure Communication Services (Email) — OTP delivery
############################################

resource "azurerm_communication_service" "acs" {
  name                = local.acs_name
  resource_group_name = local.rg_name
  data_location       = "United States"
  tags                = local.tags
}

resource "azurerm_email_communication_service" "acs_email" {
  name                = "${local.acs_name}-email"
  resource_group_name = local.rg_name
  data_location       = "United States"
  tags                = local.tags
}

resource "azurerm_email_communication_service_domain" "acs_domain" {
  name              = "AzureManagedDomain"
  email_service_id  = azurerm_email_communication_service.acs_email.id
  domain_management = "AzureManaged"
  tags              = local.tags
}

resource "azurerm_key_vault_secret" "acs_connection_string" {
  name         = "ACS-CONNECTION-STRING"
  value        = azurerm_communication_service.acs.primary_connection_string
  key_vault_id = azurerm_key_vault.kv.id

  depends_on = [azurerm_role_assignment.kv_admin_self]
}
