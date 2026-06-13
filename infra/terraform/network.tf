############################################
# Networking — VNet, subnets, NSGs, DNS zones
############################################

resource "azurerm_network_security_group" "nsg_app" {
  name                = local.nsg_app_name
  location            = local.loc
  resource_group_name = local.rg_name
  tags                = local.tags
}

resource "azurerm_network_security_group" "nsg_pe" {
  name                = local.nsg_pe_name
  location            = local.loc
  resource_group_name = local.rg_name
  tags                = local.tags
}

resource "azurerm_virtual_network" "vnet" {
  name                = local.vnet_name
  location            = local.loc
  resource_group_name = local.rg_name
  address_space       = ["10.30.0.0/16"]
  tags                = local.tags
}

resource "azurerm_subnet" "snet_app" {
  name                              = local.snet_app_name
  resource_group_name               = local.rg_name
  virtual_network_name              = azurerm_virtual_network.vnet.name
  address_prefixes                  = ["10.30.1.0/24"]
  private_endpoint_network_policies = "Disabled"

  delegation {
    name = "delegation-app-service"

    service_delegation {
      name = "Microsoft.Web/serverFarms"
      actions = [
        "Microsoft.Network/virtualNetworks/subnets/action"
      ]
    }
  }
}

resource "azurerm_subnet" "snet_pe" {
  name                              = local.snet_pe_name
  resource_group_name               = local.rg_name
  virtual_network_name              = azurerm_virtual_network.vnet.name
  address_prefixes                  = ["10.30.2.0/24"]
  private_endpoint_network_policies = "Disabled"
}

resource "azurerm_subnet" "snet_apim" {
  name                              = local.snet_apim_name
  resource_group_name               = local.rg_name
  virtual_network_name              = azurerm_virtual_network.vnet.name
  address_prefixes                  = ["10.30.3.0/27"]
  private_endpoint_network_policies = "Enabled"
}

resource "azurerm_subnet_network_security_group_association" "snet_app_nsg" {
  subnet_id                 = azurerm_subnet.snet_app.id
  network_security_group_id = azurerm_network_security_group.nsg_app.id
}

resource "azurerm_subnet_network_security_group_association" "snet_pe_nsg" {
  subnet_id                 = azurerm_subnet.snet_pe.id
  network_security_group_id = azurerm_network_security_group.nsg_pe.id
}

# Private DNS zones for every service that gets a private endpoint
locals {
  private_dns_zones = {
    blob   = "privatelink.blob.core.windows.net"
    kv     = "privatelink.vaultcore.azure.net"
    cosmos = "privatelink.documents.azure.com"
    acs    = "privatelink.communication.azure.com"
    web    = "privatelink.azurewebsites.net"
    openai = "privatelink.openai.azure.com"
    aisvc  = "privatelink.cognitiveservices.azure.com"
  }
}

resource "azurerm_private_dns_zone" "zone" {
  for_each            = local.private_dns_zones
  name                = each.value
  resource_group_name = local.rg_name
  tags                = local.tags
}

resource "azurerm_private_dns_zone_virtual_network_link" "vnet_link" {
  for_each              = local.private_dns_zones
  name                  = "${each.key}-link"
  resource_group_name   = local.rg_name
  private_dns_zone_name = azurerm_private_dns_zone.zone[each.key].name
  virtual_network_id    = azurerm_virtual_network.vnet.id
  registration_enabled  = false
  tags                  = local.tags
}
