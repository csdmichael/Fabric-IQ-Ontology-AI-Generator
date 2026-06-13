############################################
# App Service plan + API (private) + UI (public)
############################################

resource "azurerm_service_plan" "plan" {
  name                = var.app_plan_name
  resource_group_name = local.rg_name
  location            = local.loc
  os_type             = "Linux"
  sku_name            = "P1v3"
  tags                = local.tags
}

# --- API (private, VNet-integrated, blocks public traffic) -------------------

resource "azurerm_linux_web_app" "api" {
  name                          = var.api_app_name
  resource_group_name           = local.rg_name
  location                      = local.loc
  service_plan_id               = azurerm_service_plan.plan.id
  https_only                    = true
  public_network_access_enabled = false
  virtual_network_subnet_id     = azurerm_subnet.snet_app.id
  tags                          = local.tags

  identity {
    type         = "UserAssigned"
    identity_ids = [azurerm_user_assigned_identity.fabriciq.id]
  }

  site_config {
    always_on        = true
    ftps_state       = "Disabled"
    http2_enabled    = true
    minimum_tls_version = "1.2"

    application_stack {
      node_version = var.node_version
    }

    ip_restriction_default_action = "Deny"
    scm_ip_restriction_default_action = "Deny"

    ip_restriction {
      name                      = "allow-ui-vnet"
      action                    = "Allow"
      priority                  = 100
      virtual_network_subnet_id = azurerm_subnet.snet_app.id
    }
  }

  app_settings = {
    WEBSITE_RUN_FROM_PACKAGE          = "1"
    WEBSITES_PORT                     = "8080"
    NODE_ENV                          = "production"
    AZURE_TENANT_ID                   = var.tenant_id
    AZURE_CLIENT_ID                   = azurerm_user_assigned_identity.fabriciq.client_id
    AZURE_KEY_VAULT_NAME              = azurerm_key_vault.kv.name
    COSMOS_ENDPOINT                   = azurerm_cosmosdb_account.cosmos.endpoint
    COSMOS_DATABASE                   = azurerm_cosmosdb_sql_database.db.name
    BLOB_ACCOUNT_NAME                 = data.azurerm_storage_account.ai_storage.name
    BLOB_CONTAINER                    = azurerm_storage_container.fabric_ontologies.name
    ACS_SENDER_ADDRESS                = var.acs_email_sender
    APP_OWNER_SEED_EMAILS             = join(",", var.app_owner_seed_emails)
    FABRIC_WORKSPACE_ID               = var.fabric_workspace_id
    FOUNDRY_PROJECT_ENDPOINT          = var.foundry_project_endpoint
    AGENT_KEY_ONTOLOGY_GENERATOR      = "ontology-generator"
    AGENT_KEY_ONTOLOGY_DATA_BINDER    = "ontology-data-binder"
    JWT_SECRET                        = "@Microsoft.KeyVault(VaultName=${azurerm_key_vault.kv.name};SecretName=JWT-SECRET)"
    ACS_CONNECTION_STRING             = "@Microsoft.KeyVault(VaultName=${azurerm_key_vault.kv.name};SecretName=ACS-CONNECTION-STRING)"
  }

  logs {
    application_logs {
      file_system_level = "Information"
    }
    http_logs {
      file_system {
        retention_in_days = 7
        retention_in_mb   = 35
      }
    }
  }
}

resource "azurerm_private_endpoint" "api_pe" {
  name                = "pe-${var.api_app_name}"
  location            = local.loc
  resource_group_name = local.rg_name
  subnet_id           = azurerm_subnet.snet_pe.id
  tags                = local.tags

  private_service_connection {
    name                           = "api"
    private_connection_resource_id = azurerm_linux_web_app.api.id
    is_manual_connection           = false
    subresource_names              = ["sites"]
  }

  private_dns_zone_group {
    name                 = "web"
    private_dns_zone_ids = [azurerm_private_dns_zone.zone["web"].id]
  }
}

# --- UI (public, VNet-integrated so it can call private API) -----------------

resource "azurerm_linux_web_app" "ui" {
  name                          = var.ui_app_name
  resource_group_name           = local.rg_name
  location                      = local.loc
  service_plan_id               = azurerm_service_plan.plan.id
  https_only                    = true
  public_network_access_enabled = true
  virtual_network_subnet_id     = azurerm_subnet.snet_app.id
  tags                          = local.tags

  identity {
    type         = "UserAssigned"
    identity_ids = [azurerm_user_assigned_identity.fabriciq.id]
  }

  site_config {
    always_on           = true
    ftps_state          = "Disabled"
    http2_enabled       = true
    minimum_tls_version = "1.2"

    application_stack {
      node_version = var.node_version
    }
  }

  app_settings = {
    WEBSITE_RUN_FROM_PACKAGE = "1"
    WEBSITES_PORT            = "8080"
    NODE_ENV                 = "production"
    API_BASE_URL             = "https://${azurerm_linux_web_app.api.default_hostname}"
    ENTRA_TENANT_ID          = var.tenant_id
    ENTRA_CLIENT_ID          = var.entra_client_id
  }

  logs {
    application_logs {
      file_system_level = "Information"
    }
    http_logs {
      file_system {
        retention_in_days = 7
        retention_in_mb   = 35
      }
    }
  }
}

############################################
# RBAC — workload identity → data services
############################################

# Cosmos DB built-in Data Contributor (per data plane RBAC)
resource "azapi_resource" "cosmos_data_contributor" {
  type      = "Microsoft.DocumentDB/databaseAccounts/sqlRoleAssignments@2024-05-15"
  name      = "00000000-0000-0000-0000-000000000001"
  parent_id = azurerm_cosmosdb_account.cosmos.id

  body = jsonencode({
    properties = {
      roleDefinitionId = "${azurerm_cosmosdb_account.cosmos.id}/sqlRoleDefinitions/00000000-0000-0000-0000-000000000002"
      principalId      = azurerm_user_assigned_identity.fabriciq.principal_id
      scope            = azurerm_cosmosdb_account.cosmos.id
    }
  })
}

resource "azurerm_role_assignment" "storage_blob_data_contributor" {
  scope                = data.azurerm_storage_account.ai_storage.id
  role_definition_name = "Storage Blob Data Contributor"
  principal_id         = azurerm_user_assigned_identity.fabriciq.principal_id
}

# Foundry / AI Services (existing) — grant the workload identity Cognitive Services User
data "azapi_resource" "foundry_ai_services" {
  type      = "Microsoft.CognitiveServices/accounts@2024-10-01"
  name      = var.foundry_ai_services_name
  parent_id = "/subscriptions/${var.subscription_id}/resourceGroups/${var.foundry_resource_group_name}"
}

resource "azurerm_role_assignment" "foundry_user" {
  scope                = data.azapi_resource.foundry_ai_services.id
  role_definition_name = "Cognitive Services User"
  principal_id         = azurerm_user_assigned_identity.fabriciq.principal_id
}

# ACS — Communication Services Contributor
resource "azurerm_role_assignment" "acs_contributor" {
  scope                = azurerm_communication_service.acs.id
  role_definition_name = "Contributor"
  principal_id         = azurerm_user_assigned_identity.fabriciq.principal_id
}
