subscription_id      = "86b37969-9445-49cf-b03f-d8866235171c"
tenant_id            = "b158173c-91f6-4f99-b5e9-aa9bcb463863"
resource_group_name  = "ai-myaacoub"
location             = "eastus2"
name_prefix          = "fabriciq"
app_plan_name        = "plan-fabriciq-b3"
api_app_name         = "api-fabriciq-b3"
ui_app_name          = "ui-fabriciq-b3"
node_version         = "20-lts"

fabric_workspace_id       = "2b2c447d-86e1-4982-a5b6-09d2e0f3482d"
foundry_project_endpoint  = "https://002-ai-poc-private.services.ai.azure.com/api/projects/proj-default"
foundry_ai_services_name  = "002-ai-poc-private"
apim_name                 = "ai-gateway-apim-poc-my"

acs_email_sender = "DoNotReply@fabriciq-shortages-email-b3.azurecomm.net"

# Populate after registering the Entra application
entra_client_id = ""

app_owner_seed_emails = [
  "admin@MngEnvMCAP829495.onmicrosoft.com",
  "myaacoub@MngEnvMCAP829495.onmicrosoft.com",
  "myaacoub@microsoft.com"
]

tags = {
  project     = "fabric-iq-ontology-ai-generator"
  environment = "demo"
  owner       = "myaacoub"
}
