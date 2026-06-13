variable "subscription_id" {
  description = "Azure subscription ID for the Fabric IQ workload."
  type        = string
  default     = "86b37969-9445-49cf-b03f-d8866235171c"
}

variable "tenant_id" {
  description = "Microsoft Entra ID tenant containing seed users."
  type        = string
  default     = "b158173c-91f6-4f99-b5e9-aa9bcb463863"
}

variable "resource_group_name" {
  description = "Existing resource group hosting all Fabric IQ resources."
  type        = string
  default     = "ai-myaacoub"
}

variable "location" {
  description = "Primary Azure region."
  type        = string
  default     = "eastus2"
}

variable "name_prefix" {
  description = "Short prefix for all newly-created resources (must match the existing fleet)."
  type        = string
  default     = "fabriciq"
}

variable "app_plan_name" {
  description = "Existing or new Linux App Service plan name."
  type        = string
  default     = "plan-fabriciq-b3"
}

variable "api_app_name" {
  description = "Web App name for the private Node.js API."
  type        = string
  default     = "api-fabriciq-b3"
}

variable "ui_app_name" {
  description = "Web App name for the public Angular UI."
  type        = string
  default     = "ui-fabriciq-b3"
}

variable "node_version" {
  description = "Node.js runtime version for both web apps."
  type        = string
  default     = "20-lts"
}

variable "fabric_workspace_id" {
  description = "Microsoft Fabric workspace ID for ontology deployment."
  type        = string
  default     = "2b2c447d-86e1-4982-a5b6-09d2e0f3482d"
}

variable "foundry_project_endpoint" {
  description = "Microsoft Foundry project endpoint (private)."
  type        = string
  default     = "https://002-ai-poc-private.services.ai.azure.com/api/projects/proj-default"
}

variable "foundry_ai_services_name" {
  description = "Existing AI Services account name backing the Foundry project."
  type        = string
  default     = "002-ai-poc-private"
}

variable "foundry_resource_group_name" {
  description = "Resource group of the existing AI Services / Foundry account."
  type        = string
  default     = "ai-myaacoub"
}

variable "apim_name" {
  description = "Existing AI Gateway APIM instance name."
  type        = string
  default     = "ai-gateway-apim-poc-my"
}

variable "apim_resource_group_name" {
  description = "Resource group hosting the AI Gateway APIM instance."
  type        = string
  default     = "ai-myaacoub"
}

variable "acs_email_sender" {
  description = "Verified ACS email sender address."
  type        = string
  default     = "DoNotReply@fabriciq-shortages-email-b3.azurecomm.net"
}

variable "entra_client_id" {
  description = "Microsoft Entra ID app (client) ID used by the UI for Entra login."
  type        = string
  default     = ""
}

variable "app_owner_seed_emails" {
  description = "Initial App Owner allow-list email addresses."
  type        = list(string)
  default = [
    "admin@MngEnvMCAP829495.onmicrosoft.com",
    "myaacoub@MngEnvMCAP829495.onmicrosoft.com",
    "myaacoub@microsoft.com"
  ]
}

variable "tags" {
  description = "Tags applied to every resource."
  type        = map(string)
  default = {
    project     = "fabric-iq-ontology-ai-generator"
    environment = "demo"
    owner       = "myaacoub"
  }
}
