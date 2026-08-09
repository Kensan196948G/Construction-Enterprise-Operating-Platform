output "resource_group_name" {
  description = "Name of the resource group"
  value       = azurerm_resource_group.main.name
}

output "acr_login_server" {
  description = "Azure Container Registry login server URL"
  value       = azurerm_container_registry.main.login_server
}

output "acr_name" {
  description = "Azure Container Registry name"
  value       = azurerm_container_registry.main.name
}

output "web_app_url" {
  description = "Public URL of the web application"
  value       = "https://${var.custom_domain}"
}

output "web_app_fqdn" {
  description = "Container Apps FQDN for the web application"
  value       = azurerm_container_app.web.ingress[0].fqdn
}

output "api_fqdn" {
  description = "Container Apps FQDN for the API (internal)"
  value       = azurerm_container_app.api.ingress[0].fqdn
}

output "postgres_fqdn" {
  description = "PostgreSQL Flexible Server FQDN"
  value       = azurerm_postgresql_flexible_server.main.fqdn
}

output "key_vault_uri" {
  description = "Key Vault URI"
  value       = azurerm_key_vault.main.vault_uri
}

output "container_app_environment_id" {
  description = "Container Apps Environment resource ID"
  value       = azurerm_container_app_environment.main.id
}

output "api_managed_identity_principal_id" {
  description = "API Container App managed identity principal ID (for RBAC assignments)"
  value       = azurerm_container_app.api.identity[0].principal_id
}

output "web_managed_identity_principal_id" {
  description = "Web Container App managed identity principal ID (for RBAC assignments)"
  value       = azurerm_container_app.web.identity[0].principal_id
}
