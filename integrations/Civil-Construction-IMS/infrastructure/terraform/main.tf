terraform {
  required_version = ">= 1.7.0"

  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 4.0"
    }
    azuread = {
      source  = "hashicorp/azuread"
      version = "~> 3.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.6"
    }
  }

  backend "azurerm" {
    resource_group_name  = "civil-ims-tfstate-rg"
    storage_account_name = "civilimstfstate"
    container_name       = "tfstate"
    key                  = "civil-ims.terraform.tfstate"
  }
}

provider "azurerm" {
  features {
    key_vault {
      purge_soft_delete_on_destroy    = false
      recover_soft_deleted_key_vaults = true
    }
    resource_group {
      prevent_deletion_if_contains_resources = false
    }
  }
}

# ---- Resource Group ----
resource "azurerm_resource_group" "main" {
  name     = "${var.project_name}-${var.environment}-rg"
  location = var.location
  tags     = local.common_tags
}

# ---- Log Analytics Workspace ----
resource "azurerm_log_analytics_workspace" "main" {
  name                = "${var.project_name}-${var.environment}-law"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  sku                 = "PerGB2018"
  retention_in_days   = 30
  tags                = local.common_tags
}

# ---- Container Registry ----
resource "azurerm_container_registry" "main" {
  name                = replace("${var.project_name}${var.environment}acr", "-", "")
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  sku                 = "Basic"
  admin_enabled       = false
  tags                = local.common_tags
}

# ---- Key Vault ----
data "azurerm_client_config" "current" {}

resource "azurerm_key_vault" "main" {
  name                        = "${var.project_name}-${var.environment}-kv"
  location                    = azurerm_resource_group.main.location
  resource_group_name         = azurerm_resource_group.main.name
  tenant_id                   = data.azurerm_client_config.current.tenant_id
  sku_name                    = "standard"
  soft_delete_retention_days  = 7
  purge_protection_enabled    = true
  enable_rbac_authorization   = true
  tags                        = local.common_tags
}

# ---- PostgreSQL Flexible Server ----
resource "random_password" "postgres" {
  length           = 24
  special          = true
  override_special = "!#$%&()*+,-.:;<=>?@[]^_{|}~"
}

resource "azurerm_postgresql_flexible_server" "main" {
  name                          = "${var.project_name}-${var.environment}-pg"
  resource_group_name           = azurerm_resource_group.main.name
  location                      = azurerm_resource_group.main.location
  version                       = "16"
  administrator_login           = "imsadmin"
  administrator_password        = random_password.postgres.result
  storage_mb                    = 32768
  sku_name                      = var.postgres_sku
  backup_retention_days         = 7
  geo_redundant_backup_enabled  = false
  public_network_access_enabled = false
  tags                          = local.common_tags

  authentication {
    active_directory_auth_enabled = false
    password_auth_enabled         = true
  }
}

resource "azurerm_postgresql_flexible_server_database" "main" {
  name      = "civil_ims_db"
  server_id = azurerm_postgresql_flexible_server.main.id
  collation = "en_US.utf8"
  charset   = "utf8"
}

# Store DB password in Key Vault
resource "azurerm_key_vault_secret" "postgres_password" {
  name         = "postgres-password"
  value        = random_password.postgres.result
  key_vault_id = azurerm_key_vault.main.id
  depends_on   = [azurerm_key_vault.main]
}

resource "azurerm_key_vault_secret" "database_url" {
  name  = "database-url"
  value = "postgresql://imsadmin:${random_password.postgres.result}@${azurerm_postgresql_flexible_server.main.fqdn}:5432/civil_ims_db?sslmode=require"
  key_vault_id = azurerm_key_vault.main.id
  depends_on   = [azurerm_key_vault.main]
}

# ---- Azure Cache for Redis ----
resource "azurerm_redis_cache" "main" {
  name                = "${var.project_name}-${var.environment}-redis"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  capacity            = 0
  family              = "C"
  sku_name            = "Basic"
  enable_non_ssl_port = false
  minimum_tls_version = "1.2"
  tags                = local.common_tags
}

resource "azurerm_key_vault_secret" "redis_url" {
  name         = "redis-url"
  value        = "rediss://:${azurerm_redis_cache.main.primary_access_key}@${azurerm_redis_cache.main.hostname}:6380"
  key_vault_id = azurerm_key_vault.main.id
  depends_on   = [azurerm_key_vault.main]
}

# ---- Container Apps Environment ----
resource "azurerm_container_app_environment" "main" {
  name                       = "${var.project_name}-${var.environment}-cae"
  location                   = azurerm_resource_group.main.location
  resource_group_name        = azurerm_resource_group.main.name
  log_analytics_workspace_id = azurerm_log_analytics_workspace.main.id
  tags                       = local.common_tags
}

# ---- Container Apps — API ----
resource "azurerm_container_app" "api" {
  name                         = "${var.project_name}-${var.environment}-api"
  container_app_environment_id = azurerm_container_app_environment.main.id
  resource_group_name          = azurerm_resource_group.main.name
  revision_mode                = "Single"
  tags                         = local.common_tags

  identity {
    type = "SystemAssigned"
  }

  registry {
    server   = azurerm_container_registry.main.login_server
    identity = "System"
  }

  ingress {
    external_enabled = false
    target_port      = 4000
    traffic_weight {
      percentage      = 100
      latest_revision = true
    }
  }

  template {
    min_replicas = 1
    max_replicas = var.api_max_replicas

    container {
      name   = "api"
      image  = "${azurerm_container_registry.main.login_server}/${var.project_name}-api:${var.api_image_tag}"
      cpu    = var.api_cpu
      memory = var.api_memory

      env {
        name        = "DATABASE_URL"
        secret_name = "database-url"
      }
      env {
        name        = "REDIS_URL"
        secret_name = "redis-url"
      }
      env {
        name        = "JWT_SECRET"
        secret_name = "jwt-secret"
      }
      env {
        name  = "AZURE_AD_CLIENT_ID"
        value = var.azure_ad_client_id
      }
      env {
        name  = "AZURE_AD_TENANT_ID"
        value = var.azure_ad_tenant_id
      }
      env {
        name        = "AZURE_AD_CLIENT_SECRET"
        secret_name = "azure-ad-client-secret"
      }
      env {
        name  = "NODE_ENV"
        value = "production"
      }
      env {
        name  = "APP_ENV"
        value = "production"
      }
      env {
        name  = "LOG_LEVEL"
        value = "info"
      }

      liveness_probe {
        transport = "HTTP"
        path      = "/api/v1/health"
        port      = 4000
      }
      readiness_probe {
        transport = "HTTP"
        path      = "/api/v1/health"
        port      = 4000
      }
    }
  }

  secret {
    name  = "database-url"
    value = azurerm_key_vault_secret.database_url.value
  }
  secret {
    name  = "redis-url"
    value = azurerm_key_vault_secret.redis_url.value
  }
  secret {
    name  = "jwt-secret"
    value = var.jwt_secret
  }
  secret {
    name  = "azure-ad-client-secret"
    value = var.azure_ad_client_secret
  }
}

# AcrPull role: allow API Container App managed identity to pull images
resource "azurerm_role_assignment" "api_acr_pull" {
  scope                = azurerm_container_registry.main.id
  role_definition_name = "AcrPull"
  principal_id         = azurerm_container_app.api.identity[0].principal_id
}

# ---- Container Apps — Web ----
resource "azurerm_container_app" "web" {
  name                         = "${var.project_name}-${var.environment}-web"
  container_app_environment_id = azurerm_container_app_environment.main.id
  resource_group_name          = azurerm_resource_group.main.name
  revision_mode                = "Single"
  tags                         = local.common_tags

  identity {
    type = "SystemAssigned"
  }

  registry {
    server   = azurerm_container_registry.main.login_server
    identity = "System"
  }

  ingress {
    external_enabled = true
    target_port      = 3000
    traffic_weight {
      percentage      = 100
      latest_revision = true
    }
    custom_domain {
      name                     = var.custom_domain
      certificate_binding_type = "SniEnabled"
    }
  }

  template {
    min_replicas = 1
    max_replicas = var.web_max_replicas

    container {
      name   = "web"
      image  = "${azurerm_container_registry.main.login_server}/${var.project_name}-web:${var.web_image_tag}"
      cpu    = var.web_cpu
      memory = var.web_memory

      env {
        name  = "NODE_ENV"
        value = "production"
      }
      env {
        name  = "NEXT_TELEMETRY_DISABLED"
        value = "1"
      }
      env {
        name  = "NEXTAUTH_URL"
        value = "https://${var.custom_domain}"
      }
      env {
        name        = "NEXTAUTH_SECRET"
        secret_name = "nextauth-secret"
      }
      env {
        name  = "AZURE_AD_CLIENT_ID"
        value = var.azure_ad_client_id
      }
      env {
        name  = "AZURE_AD_TENANT_ID"
        value = var.azure_ad_tenant_id
      }
      env {
        name        = "AZURE_AD_CLIENT_SECRET"
        secret_name = "azure-ad-client-secret"
      }
      env {
        name  = "API_BASE_URL"
        value = "https://${azurerm_container_app.api.ingress[0].fqdn}/api/v1"
      }
      env {
        name  = "APP_ENV"
        value = "production"
      }
    }
  }

  secret {
    name  = "nextauth-secret"
    value = var.nextauth_secret
  }
  secret {
    name  = "azure-ad-client-secret"
    value = var.azure_ad_client_secret
  }
}

# AcrPull role: allow Web Container App managed identity to pull images
resource "azurerm_role_assignment" "web_acr_pull" {
  scope                = azurerm_container_registry.main.id
  role_definition_name = "AcrPull"
  principal_id         = azurerm_container_app.web.identity[0].principal_id
}
