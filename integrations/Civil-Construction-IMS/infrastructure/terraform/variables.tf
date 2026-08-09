variable "project_name" {
  description = "Project name prefix for all resources"
  type        = string
  default     = "civil-ims"
}

variable "environment" {
  description = "Deployment environment (prod, staging, dev)"
  type        = string
  default     = "prod"
}

variable "location" {
  description = "Azure region"
  type        = string
  default     = "japaneast"
}

# ---- PostgreSQL ----
variable "postgres_sku" {
  description = "PostgreSQL Flexible Server SKU"
  type        = string
  default     = "B_Standard_B1ms"
}

# ---- Container Apps — API ----
variable "api_max_replicas" {
  description = "Maximum replica count for the API container app"
  type        = number
  default     = 3
}

variable "api_cpu" {
  description = "CPU allocation for API container (vCPU)"
  type        = number
  default     = 0.5
}

variable "api_memory" {
  description = "Memory allocation for API container"
  type        = string
  default     = "1Gi"
}

variable "api_image_tag" {
  description = "Docker image tag for the API container"
  type        = string
  default     = "latest"
}

# ---- Container Apps — Web ----
variable "web_max_replicas" {
  description = "Maximum replica count for the Web container app"
  type        = number
  default     = 3
}

variable "web_cpu" {
  description = "CPU allocation for Web container (vCPU)"
  type        = number
  default     = 0.5
}

variable "web_memory" {
  description = "Memory allocation for Web container"
  type        = string
  default     = "1Gi"
}

variable "web_image_tag" {
  description = "Docker image tag for the Web container"
  type        = string
  default     = "latest"
}

# ---- Azure AD ----
variable "azure_ad_client_id" {
  description = "Azure AD (Entra ID) application client ID"
  type        = string
  sensitive   = false
}

variable "azure_ad_tenant_id" {
  description = "Azure AD (Entra ID) tenant ID"
  type        = string
  sensitive   = false
}

variable "azure_ad_client_secret" {
  description = "Azure AD (Entra ID) application client secret"
  type        = string
  sensitive   = true
}

# ---- Application Secrets ----
variable "jwt_secret" {
  description = "JWT signing secret for IMS API"
  type        = string
  sensitive   = true
}

variable "nextauth_secret" {
  description = "NextAuth.js session encryption secret"
  type        = string
  sensitive   = true
}

# ---- Domain ----
variable "custom_domain" {
  description = "Custom domain for the web application (e.g. ims.example.com)"
  type        = string
}
