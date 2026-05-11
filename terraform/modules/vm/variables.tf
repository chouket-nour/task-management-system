variable "project_name" {
  type        = string
  description = "Préfixe pour nommer toutes les ressources"
}

variable "resource_group_name" {
  type        = string
  description = "Nom du resource group"
}

variable "location" {
  type        = string
  description = "Région Azure Stack Hub"
}

variable "subnet_jumpbox_id" {
  type        = string
  description = "ID du subnet jumpbox (output du module network)"
}

variable "subnet_tools_id" {
  type        = string
  description = "ID du subnet tools (output du module network)"
}

variable "jumpbox_private_ip" {
  type        = string
  default     = "10.0.3.4"
  description = "IP privée statique du jumpbox"
}

variable "jenkins_private_ip" {
  type        = string
  default     = "10.0.2.4"
  description = "IP privée statique de Jenkins"
}

variable "vm_size_jumpbox" {
  type        = string
  default     = "Standard_DS2_v2"
  description = "Taille VM jumpbox"
}

variable "vm_size_jenkins" {
  type        = string
  default     = "Standard_DS2_v2"
  description = "Taille VM Jenkins"
}

variable "admin_username" {
  type        = string
  default     = "nouradmin"
  description = "Nom d'utilisateur admin des VMs"
}

variable "ssh_public_key" {
  type        = string
  description = "Clé SSH publique"
}