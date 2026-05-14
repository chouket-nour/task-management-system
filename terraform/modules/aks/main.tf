locals {
  api_model = {
    apiVersion = "vlabs"
    properties = {
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
        clientId = var.service_principal_client_id
        secret   = var.service_principal_client_secret
      }
    }
  }
}

resource "local_file" "api_model" {
  content  = jsonencode(local.api_model)
  filename = "${path.module}/apimodel.json"
}

resource "null_resource" "aks_deploy" {
  depends_on = [local_file.api_model]

  triggers = {
    api_model_hash = sha256(jsonencode(local.api_model))
  }

  provisioner "local-exec" {
    command = <<EOT
      aks-engine-azurestack deploy \
        --api-model ${path.module}/apimodel.json \
        --location ${var.location} \
        --resource-group ${var.resource_group_name} \
        --subscription-id ${var.subscription_id} \
        --client-id ${var.service_principal_client_id} \
        --client-secret ${var.service_principal_client_secret} \
        --auth-method client_secret \
        --output-directory ${path.module}/_output
    EOT
  }
}