# ── Authentification Azure Stack Hub ──────────────────────────────────────────

variable "metadata_host" {
  description = "URL endpoint Azure Resource Manager de ton Azure Stack Hub"
  type        = string
}

variable "subscription_id" {
  description = "Subscription ID"
  type        = string
  sensitive   = true
}

variable "tenant_id" {
  description = "Tenant ID Azure Active Directory"
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

# ── VMs ───────────────────────────────────────────────────────────────────────

variable "admin_username" {
  description = "Nom d'utilisateur administrateur des VMs"
  type        = string
  default     = "nouradmin"
}

variable "admin_password" {
  description = "Mot de passe administrateur des VMs"
  type        = string
  sensitive   = true
}

variable "ssh_public_key" {
  description = "Clé SSH publique pour accéder aux VMs"
  type        = string
  validation {
    condition     = startswith(var.ssh_public_key, "ssh-")
    error_message = "Doit être une clé SSH publique valide (ssh-rsa, ssh-ed25519...)."
  }
}

variable "vm_size" {
  description = "Taille des VMs Azure Stack Hub"
  type        = string
  default     = "Standard_DS2_v2"
}

# ── Réseau ────────────────────────────────────────────────────────────────────

variable "resource_group_name" {
  description = "Nom du resource group existant"
  type        = string
  default     = "RG-NOUR"
}

variable "location" {
  description = "Région Azure Stack Hub"
  type        = string
  default     = "dc2"
}

variable "project_name" {
  description = "Préfixe utilisé pour nommer toutes les ressources"
  type        = string
  default     = "devops-nour"
}

variable "vnet_address_space" {
  description = "Plage d'adresses IP du VNet"
  type        = list(string)
  default     = ["10.0.0.0/16"]
}

variable "kubernetes_version" {
  description = "Version Kubernetes"
  type        = string
  default     = "1.20.0"
}
variable "admin_ip" {
  description = "IP publique admin autorisée à SSH sur le jumpbox "
  type        = string
}
