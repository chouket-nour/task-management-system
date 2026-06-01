variable "k8s_version" {
  type    = string
  default = "1.24.9"
}

variable "master_count" {
  type    = number
  default = 1
}

variable "agent_count" {
  type    = number
  default = 2
}

variable "master_vm_size" {
  type    = string
  default = "Standard_D2_v2"
}

variable "agent_vm_size" {
  type    = string
  default = "Standard_D2_v2"
}

variable "dns_prefix" {
  type    = string
  default = "rfc-k8s"
}

variable "resource_group_name" {
  type = string
}

variable "location" {
  type    = string
  default = "dc2"
}

variable "project_name" {
  type = string
}

variable "subnet_aks_id" {
  type = string
}

variable "subnet_aks_cidr" {
  type    = string
  default = "10.0.4.0/22"   
}

variable "admin_username" {
  type = string
}

variable "ssh_public_key" {
  type = string
}

variable "client_id" {
  type = string
}

variable "secret_value" {
  type      = string
  sensitive = true
}

variable "subscription_id" {
  type = string
}

variable "tenant_id" {
  type = string
}

variable "resource_group_id" {
  type = string
}

variable "portal_url" {
  type = string
}

variable "resource_manager_endpoint" {
  type = string
}

variable "active_directory_endpoint" {
  type = string
}

variable "cloud_suffix" {
  type = string
}

# ── Réseau Kubernetes ─────────────────────────────────────────────────────────

variable "service_cidr" {
  type        = string
  default     = "10.0.8.0/24"
  description = "CIDR des services Kubernetes (ClusterIP)"
}

variable "dns_service_ip" {
  type        = string
  default     = "10.0.8.10"
  description = "IP du service DNS Kubernetes (doit être dans service_cidr)"
}