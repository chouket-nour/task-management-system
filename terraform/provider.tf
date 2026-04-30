terraform {
  required_providers {
    azurestack = {
      source  = "hashicorp/azurestack"
      version = "~> 1.0"
    }
  }
}

provider "azurestack" {
  metadata_host   = var.metadata_host
  client_id       = var.client_id
  client_secret   = var.secret_value
  subscription_id = var.subscription_id
  tenant_id       = var.tenant_id

  features {}
}