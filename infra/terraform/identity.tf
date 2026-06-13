############################################
# User-assigned managed identity + Key Vault
############################################

resource "azurerm_user_assigned_identity" "fabriciq" {
  name                = local.identity_name
  resource_group_name = local.rg_name
  location            = local.loc
  tags                = local.tags
}

resource "azurerm_key_vault" "kv" {
  name                          = local.key_vault_name
  resource_group_name           = local.rg_name
  location                      = local.loc
  tenant_id                     = var.tenant_id
  sku_name                      = "standard"
  enable_rbac_authorization     = true
  purge_protection_enabled      = true
  soft_delete_retention_days    = 7
  public_network_access_enabled = false
  tags                          = local.tags

  network_acls {
    default_action = "Deny"
    bypass         = "AzureServices"
  }
}

# Grant the deployment principal Key Vault Administrator so it can seed secrets
resource "azurerm_role_assignment" "kv_admin_self" {
  scope                = azurerm_key_vault.kv.id
  role_definition_name = "Key Vault Administrator"
  principal_id         = data.azurerm_client_config.current.object_id
}

# Grant the workload identity Key Vault Secrets User so the API can read secrets at runtime
resource "azurerm_role_assignment" "kv_secrets_user_workload" {
  scope                = azurerm_key_vault.kv.id
  role_definition_name = "Key Vault Secrets User"
  principal_id         = azurerm_user_assigned_identity.fabriciq.principal_id
}

# Random JWT signing secret (rotatable, never committed)
resource "random_password" "jwt_secret" {
  length  = 64
  special = true
}

resource "azurerm_key_vault_secret" "jwt_secret" {
  name         = "JWT-SECRET"
  value        = random_password.jwt_secret.result
  key_vault_id = azurerm_key_vault.kv.id

  depends_on = [azurerm_role_assignment.kv_admin_self]
}

resource "azurerm_key_vault_secret" "entra_client_id" {
  count        = var.entra_client_id == "" ? 0 : 1
  name         = "ENTRA-CLIENT-ID"
  value        = var.entra_client_id
  key_vault_id = azurerm_key_vault.kv.id

  depends_on = [azurerm_role_assignment.kv_admin_self]
}

resource "azurerm_key_vault_secret" "fabric_workspace_id" {
  name         = "FABRIC-WORKSPACE-ID"
  value        = var.fabric_workspace_id
  key_vault_id = azurerm_key_vault.kv.id

  depends_on = [azurerm_role_assignment.kv_admin_self]
}

resource "azurerm_key_vault_secret" "foundry_endpoint" {
  name         = "FOUNDRY-PROJECT-ENDPOINT"
  value        = var.foundry_project_endpoint
  key_vault_id = azurerm_key_vault.kv.id

  depends_on = [azurerm_role_assignment.kv_admin_self]
}

# Private endpoint for Key Vault
resource "azurerm_private_endpoint" "kv_pe" {
  name                = "pe-${azurerm_key_vault.kv.name}"
  location            = local.loc
  resource_group_name = local.rg_name
  subnet_id           = azurerm_subnet.snet_pe.id
  tags                = local.tags

  private_service_connection {
    name                           = "kv"
    private_connection_resource_id = azurerm_key_vault.kv.id
    is_manual_connection           = false
    subresource_names              = ["vault"]
  }

  private_dns_zone_group {
    name                 = "kv"
    private_dns_zone_ids = [azurerm_private_dns_zone.zone["kv"].id]
  }
}
