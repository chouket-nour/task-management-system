locals {
  api_model = {
    apiVersion = "vlabs"
    properties = {
      customCloudProfile = {
        portalURL      = var.portal_url
        identitySystem = "adfs"
        environment = {
          name                    = "AzureStackCloud"
          resourceManagerEndpoint = var.resource_manager_endpoint
          activeDirectoryEndpoint = var.active_directory_endpoint
          graphEndpoint           = "https://graph.windows.net/"
          keyVaultEndpoint        = "https://vault.${var.cloud_suffix}/"
          storageEndpointSuffix   = var.cloud_suffix
          keyVaultDNSSuffix       = "vault.${var.cloud_suffix}"
        }
      }
      orchestratorProfile = {
        orchestratorType    = "Kubernetes"
        orchestratorVersion = var.k8s_version
        kubernetesConfig = {
          networkPlugin = "azure"
        }
      }
      masterProfile = {
        count                    = var.master_count
        dnsPrefix                = var.dns_prefix
        vmSize                   = var.master_vm_size
        distro                   = "aks-ubuntu-18.04"
        vnetSubnetID             = var.subnet_aks_id
        firstConsecutiveStaticIP = "10.0.1.5"
      }
      agentPoolProfiles = [
        {
          name                = "agentpool"
          count               = var.agent_count
          vmSize              = var.agent_vm_size
          distro              = "aks-ubuntu-18.04"
          vnetSubnetID        = var.subnet_aks_id
          availabilityProfile = "AvailabilitySet"
        }
      ]
      linuxProfile = {
        adminUsername = var.admin_username
        ssh = {
          publicKeys = [
            { keyData = var.ssh_public_key }
          ]
        }
      }
      servicePrincipalProfile = {
        clientId = var.client_id
        secret   = var.secret_value
      }
    }
  }

  apimodel_path = abspath("${path.module}/apimodel.json")
}

resource "local_file" "api_model" {
  content         = jsonencode(local.api_model)
  filename        = local.apimodel_path
  file_permission = "0600"
}