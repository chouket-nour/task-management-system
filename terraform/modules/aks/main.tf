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
        clientId = var.client_id
        secret   = var.secret_value
      }
    }
  }

  output_dir    = abspath("${path.module}/_output")
  apimodel_path = abspath("${path.module}/apimodel.json")
}

resource "local_file" "api_model" {
  content         = jsonencode(local.api_model)
  filename        = local.apimodel_path
  file_permission = "0600"
}

resource "null_resource" "aks_deploy" {
  depends_on = [local_file.api_model]

  triggers = {
    api_model_hash = sha256(jsonencode(local.api_model))
  }

  provisioner "local-exec" {
    interpreter = ["/bin/bash", "-euo", "pipefail", "-c"]

    environment = {
      AKS_API_MODEL     = local.apimodel_path
      AKS_LOCATION      = var.location
      AKS_RG            = var.resource_group_name
      AKS_SUB_ID        = var.subscription_id
      AKS_CLIENT_ID     = var.client_id
      AKS_CLIENT_SECRET = var.secret_value
      AKS_OUTPUT_DIR    = local.output_dir
    }

    command = <<-EOT
      mkdir -p "$AKS_OUTPUT_DIR"

      aks-engine-azurestack deploy \
        --api-model      "$AKS_API_MODEL"     \
        --location       "$AKS_LOCATION"      \
        --resource-group "$AKS_RG"            \
        --subscription-id "$AKS_SUB_ID"       \
        --client-id      "$AKS_CLIENT_ID"     \
        --client-secret  "$AKS_CLIENT_SECRET" \
        --auth-method    client_secret        \
        --azure-env      AzureStackCloud      \
        --identity-system adfs                \
        --force-overwrite                     \
        --output-directory "$AKS_OUTPUT_DIR"
    EOT
  }
}