terraform {
  required_providers {
    azurestack = {
      source  = "hashicorp/azurestack"
      version = "~> 1.0"
    }
  }
}

provider "azurestack" {
  features {}
  metadata_host   = "management.dc2.xpressazure.com"
  subscription_id = "b55f73e9-9312-4a0a-b46b-44d350cf1fcc"
  tenant_id       = "83815bfb-2605-4d45-be53-8066974eb65f"
}