variable "k8s_version" {
  type    = string
  default = "1.31.13"
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
  type = string
}

variable "project_name" {
  type = string
}

variable "subnet_aks_id" {
  type = string
}

variable "subnet_aks_cidr" {
  type = string
}

variable "admin_username" {
  type = string
}

variable "ssh_public_key" {
  type = string
}

variable "service_principal_client_id" {
  type = string
}

variable "service_principal_client_secret" {
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