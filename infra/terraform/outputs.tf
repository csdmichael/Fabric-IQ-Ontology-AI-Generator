output "resource_group_name" {
  value = local.rg_name
}

output "vnet_id" {
  value = azurerm_virtual_network.vnet.id
}

output "key_vault_uri" {
  value = azurerm_key_vault.kv.vault_uri
}

output "key_vault_name" {
  value = azurerm_key_vault.kv.name
}

output "workload_identity_id" {
  value = azurerm_user_assigned_identity.fabriciq.id
}

output "workload_identity_client_id" {
  value = azurerm_user_assigned_identity.fabriciq.client_id
}

output "workload_identity_principal_id" {
  value = azurerm_user_assigned_identity.fabriciq.principal_id
}

output "cosmos_endpoint" {
  value = azurerm_cosmosdb_account.cosmos.endpoint
}

output "cosmos_database_name" {
  value = azurerm_cosmosdb_sql_database.db.name
}

output "storage_account_name" {
  value = data.azurerm_storage_account.ai_storage.name
}

output "storage_container_name" {
  value = azurerm_storage_container.fabric_ontologies.name
}

output "acs_resource_id" {
  value = azurerm_communication_service.acs.id
}

output "acs_email_sender" {
  value = var.acs_email_sender
}

output "api_app_name" {
  value = azurerm_linux_web_app.api.name
}

output "api_default_hostname" {
  value = azurerm_linux_web_app.api.default_hostname
}

output "ui_app_name" {
  value = azurerm_linux_web_app.ui.name
}

output "ui_default_hostname" {
  value = azurerm_linux_web_app.ui.default_hostname
}

output "foundry_project_endpoint" {
  value = var.foundry_project_endpoint
}

output "fabric_workspace_id" {
  value = var.fabric_workspace_id
}
