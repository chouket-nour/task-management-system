
provider "azurestack" {
  metadata_host   = var.metadata_host
  client_id       = var.client_id
  client_secret   = var.secret_value
  subscription_id = var.subscription_id
  tenant_id       = var.tenant_id

  features {}
}

module "network" {
  source              = "./modules/network"
  project_name        = var.project_name
  resource_group_name = var.resource_group_name
  vnet_address_space  = var.vnet_address_space
  admin_ip            = var.admin_ip
}

module "vm" {
  source              = "./modules/vm"
  project_name        = var.project_name
  resource_group_name = var.resource_group_name
  location            = var.location
  subnet_jumpbox_id   = module.network.subnet_jumpbox_id
  subnet_tools_id     = module.network.subnet_tools_id
  ssh_public_key      = var.ssh_public_key
  admin_username      = var.admin_username
  vm_size_jumpbox     = var.vm_size
  vm_size_jenkins     = var.vm_size
}

