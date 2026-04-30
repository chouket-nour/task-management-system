

variable "metadata_host" {
  description = "URL endpoint Azure Resource Manager"
  type        = string
}

variable "subscription_id" {
  description = "Subscription ID"
  type        = string
  sensitive   = true
}

variable "tenant_id" {
  description = "Tenant ID"
  type        = string
  sensitive   = true
}

variable "client_id" {
  description = "Client ID du Service Principal"
  type        = string
  sensitive   = true
}

variable "secret_value" {
  description = "Client Secret du Service Principal"
  type        = string
  sensitive   = true
}

variable "admin_password" {
  description = "Mot de passe des VMs"
  type        = string
  sensitive   = true
}

variable "admin_username" {
  description = "Nom utilisateur des VMs"
  type        = string
  default     = "nouradmin"
}

variable "vm_size" {
  description = "Taille des VMs"
  type        = string
  default     = "Standard_DS2_v2"
}

variable "resource_group_name" {
  description = "Nom du resource group"
  type        = string
  default     = "RG-NOUR"
}

variable "location" {
  description = "Région Azure Stack Hub"
  type        = string
  default     = "dc2"
}

variable "project_name" {
  description = "Préfixe des ressources"
  type        = string
  default     = "devops-nour"
}

variable "vnet_address_space" {
  description = "Plage réseau VNet"
  type        = string
  default     = "10.0.0.0/16"
}

variable "subnet_address_prefix" {
  description = "Plage sous-réseau"
  type        = string
  default     = "10.0.1.0/24"
}
variable "ssh_public_key" {
  description = "Clé SSH publique"
  type        = string
}

variable "kubernetes_version" {
  description = "Version Kubernetes pour AKS Engine"
  type        = string
  default     = "1.24.0"
}