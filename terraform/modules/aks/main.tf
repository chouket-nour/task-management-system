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
        orchestratorRelease = "1.31"   # ← Release pas Version
        orchestratorVersion = "1.31.13" 
        kubernetesConfig = {
          networkPlugin              = "kubenet"    
          useCloudControllerManager  = true
          containerRuntime           = "containerd"  
        }
      }
      masterProfile = {
        count     = var.master_count
        dnsPrefix = var.dns_prefix
        vmSize    = var.master_vm_size
        distro    = "ubuntu-18.04"     
      }
      agentPoolProfiles = [
        {
          name                = "agentpool"
          count               = var.agent_count
          vmSize              = var.agent_vm_size
          distro              = "ubuntu-18.04"       # ← changer
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
}

resource "local_file" "api_model" {
  content         = jsonencode(local.api_model)
  filename        = "${path.module}/apimodel.json"
  file_permission = "0600"
}