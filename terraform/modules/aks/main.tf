locals {
  api_model = {
    apiVersion = "vlabs"
    properties = {
      customCloudProfile = {
        portalURL      = var.portal_url
        identitySystem = "azure_ad"
      }
      orchestratorProfile = {
        orchestratorType    = "Kubernetes"
        orchestratorRelease = "1.24"
        orchestratorVersion = "1.24.9"
        kubernetesConfig = {
          networkPlugin             = "azure"
          useCloudControllerManager = true
          containerRuntime          = "containerd"
               clusterSubnet             = var.subnet_aks_cidr   
               serviceCidr               = var.service_cidr       
               dnsServiceIP              = var.dns_service_ip     
        }
      }
      masterProfile = {
        count                    = var.master_count
        dnsPrefix                = var.dns_prefix
        vmSize                   = var.master_vm_size
        distro                   = "ubuntu-18.04"
        vnetSubnetID             = var.subnet_aks_id
        firstConsecutiveStaticIP = "10.0.4.100"   
      }
      agentPoolProfiles = [
        {
          name                     = "agentpool"
          count                    = var.agent_count
          vmSize                   = var.agent_vm_size
          distro                   = "ubuntu-18.04"
          availabilityProfile      = "AvailabilitySet"
          vnetSubnetID             = var.subnet_aks_id
          
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
}

resource "local_file" "api_model" {
  content         = jsonencode(local.api_model)
  filename        = "${path.module}/apimodel.json"
  file_permission = "0600"
}