variable "project_name" {
  type        = string
  description = "Préfixe pour nommer toutes les ressources"
}

variable "resource_group_name" {
  type        = string
  description = "Nom du resource group existant"
}

variable "vnet_address_space" {
  type        = list(string)
    default = ["10.0.0.0/16", "10.244.0.0/16"]
  description = "Plage d'adresses du VNet"
}

variable "subnet_jumpbox_cidr" {
  type        = string
  default     = "10.0.3.0/24"
  description = "CIDR du subnet jumpbox"
}

variable "subnet_tools_cidr" {
  type        = string
  default     = "10.0.2.0/24"
  description = "CIDR du subnet tools"
}

variable "subnet_aks_cidr" {
  type        = string
     default = "10.0.4.0/22" 
  description = "CIDR du subnet AKS"
}

variable "admin_ip" {
  type        = string
  description = "IP publique admin pour SSH"
}

variable "jenkins_private_ip" {
  type        = string
  default     = "10.0.2.4"
  description = "IP privée Jenkins pour la règle NSG AKS"
}