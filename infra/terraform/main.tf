locals {
  rg_name = var.resource_group_name
  loc     = var.location
  tags    = var.tags

  # Reusable name fragments
  vnet_name           = "vnet-${var.name_prefix}"
  snet_app_name       = "snet-app"
  snet_pe_name        = "snet-pe"
  snet_apim_name      = "snet-apim"
  nsg_app_name        = "nsg-app"
  nsg_pe_name         = "nsg-pe"
  identity_name       = "id-${var.name_prefix}"
  key_vault_name      = "kv-${var.name_prefix}-${random_string.kv_suffix.result}"
  cosmos_account_name = "cosmos-${var.name_prefix}-demo-01"
  storage_account     = "aistoragemyaacoub"
  storage_container   = "fabric-ontologies"
  acs_name            = "${var.name_prefix}-shortages-email-b3"
}

resource "random_string" "kv_suffix" {
  length  = 4
  upper   = false
  special = false
  numeric = true
}

data "azurerm_client_config" "current" {}

data "azurerm_resource_group" "rg" {
  name = local.rg_name
}
