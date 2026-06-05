# ══════════════════════════════════════════════════════════════════
# DATA
# ══════════════════════════════════════════════════════════════════

data "azurestack_resource_group" "main" {
  name = var.resource_group_name
}

locals {
  location = data.azurestack_resource_group.main.location
  rg       = data.azurestack_resource_group.main.name
}

# ══════════════════════════════════════════════════════════════════
# VNET
# ══════════════════════════════════════════════════════════════════

resource "azurestack_virtual_network" "main" {
  name                = "${var.project_name}-vnet"
  address_space       = var.vnet_address_space
  location            = local.location
  resource_group_name = local.rg
}

# ══════════════════════════════════════════════════════════════════
# SUBNETS
# ══════════════════════════════════════════════════════════════════

resource "azurestack_subnet" "jumpbox" {
  name                 = "${var.project_name}-subnet-jumpbox"
  resource_group_name  = local.rg
  virtual_network_name = azurestack_virtual_network.main.name
  address_prefix       = var.subnet_jumpbox_cidr
}

resource "azurestack_subnet" "tools" {
  name                 = "${var.project_name}-subnet-tools"
  resource_group_name  = local.rg
  virtual_network_name = azurestack_virtual_network.main.name
  address_prefix       = var.subnet_tools_cidr
}

resource "azurestack_subnet" "aks" {
  name                 = "${var.project_name}-subnet-aks"
  resource_group_name  = local.rg
  virtual_network_name = azurestack_virtual_network.main.name
  address_prefix       = var.subnet_aks_cidr
}

# ══════════════════════════════════════════════════════════════════
# NSG — JUMPBOX
# ══════════════════════════════════════════════════════════════════

resource "azurestack_network_security_group" "jumpbox" {
  name                = "${var.project_name}-nsg-jumpbox"
  location            = local.location
  resource_group_name = local.rg

  security_rule {
    name                       = "allow-ssh-admin"
    priority                   = 100
    direction                  = "Inbound"
    access                     = "Allow"
    protocol                   = "Tcp"
    source_port_range          = "*"
    destination_port_range     = "22"
    source_address_prefix      = "*"
    destination_address_prefix = "*"
  }

  security_rule {
    name                       = "deny-all-inbound"
    priority                   = 4096
    direction                  = "Inbound"
    access                     = "Deny"
    protocol                   = "*"
    source_port_range          = "*"
    destination_port_range     = "*"
    source_address_prefix      = "*"
    destination_address_prefix = "*"
  }

  security_rule {
    name                       = "allow-outbound-internet"
    priority                   = 100
    direction                  = "Outbound"
    access                     = "Allow"
    protocol                   = "*"
    source_port_range          = "*"
    destination_port_range     = "*"
    source_address_prefix      = "*"
    destination_address_prefix = "Internet"
  }
}

# ══════════════════════════════════════════════════════════════════
# NSG — TOOLS (JENKINS)
# ══════════════════════════════════════════════════════════════════

resource "azurestack_network_security_group" "tools" {
  name                = "${var.project_name}-nsg-tools"
  location            = local.location
  resource_group_name = local.rg

  security_rule {
    name                       = "allow-ssh-from-jumpbox"
    priority                   = 100
    direction                  = "Inbound"
    access                     = "Allow"
    protocol                   = "Tcp"
    source_port_range          = "*"
    destination_port_range     = "22"
    source_address_prefix      = var.subnet_jumpbox_cidr
    destination_address_prefix = "*"
  }

  security_rule {
    name                       = "allow-jenkins-from-admin"
    priority                   = 110
    direction                  = "Inbound"
    access                     = "Allow"
    protocol                   = "Tcp"
    source_port_range          = "*"
    destination_port_range     = "8080"
    source_address_prefix      = var.subnet_jumpbox_cidr
    destination_address_prefix = "*"
  }

  security_rule {
    name                       = "allow-sonarqube-from-jumpbox"
    priority                   = 120
    direction                  = "Inbound"
    access                     = "Allow"
    protocol                   = "Tcp"
    source_port_range          = "*"
    destination_port_range     = "9000"
    source_address_prefix      = var.subnet_jumpbox_cidr
    destination_address_prefix = "*"
  }

  security_rule {
    name                       = "deny-all-inbound"
    priority                   = 4096
    direction                  = "Inbound"
    access                     = "Deny"
    protocol                   = "*"
    source_port_range          = "*"
    destination_port_range     = "*"
    source_address_prefix      = "*"
    destination_address_prefix = "*"
  }

  security_rule {
    name                       = "allow-outbound-internet"
    priority                   = 100
    direction                  = "Outbound"
    access                     = "Allow"
    protocol                   = "*"
    source_port_range          = "*"
    destination_port_range     = "*"
    source_address_prefix      = "*"
    destination_address_prefix = "Internet"
  }
}

# ══════════════════════════════════════════════════════════════════
# NSG — AKS
# ══════════════════════════════════════════════════════════════════

resource "azurestack_network_security_group" "aks" {
  name                = "${var.project_name}-nsg-aks"
  location            = local.location
  resource_group_name = local.rg

  # ── SSH depuis jumpbox ────────────────────────────────────────
  security_rule {
    name                       = "allow-ssh-from-jumpbox"
    priority                   = 100
    direction                  = "Inbound"
    access                     = "Allow"
    protocol                   = "Tcp"
    source_port_range          = "*"
    destination_port_range     = "22"
    source_address_prefix      = var.subnet_jumpbox_cidr
    destination_address_prefix = "*"
  }

  # ── Kubernetes API depuis Jenkins ─────────────────────────────
  security_rule {
    name                       = "allow-kubeapi-from-jenkins"
    priority                   = 110
    direction                  = "Inbound"
    access                     = "Allow"
    protocol                   = "Tcp"
    source_port_range          = "*"
    destination_port_range     = "443"
    source_address_prefix      = var.jenkins_private_ip
    destination_address_prefix = "*"
  }

  # ── Kubernetes API depuis jumpbox ─────────────────────────────
  security_rule {
    name                       = "allow-kubeapi-from-jumpbox"
    priority                   = 111
    direction                  = "Inbound"
    access                     = "Allow"
    protocol                   = "Tcp"
    source_port_range          = "*"
    destination_port_range     = "443"
    source_address_prefix      = var.subnet_jumpbox_cidr
    destination_address_prefix = "*"
  }

  # ── Trafic interne AKS (node↔node) ───────────────────────────
  security_rule {
    name                       = "allow-intra-aks"
    priority                   = 120
    direction                  = "Inbound"
    access                     = "Allow"
    protocol                   = "*"
    source_port_range          = "*"
    destination_port_range     = "*"
    source_address_prefix      = var.subnet_aks_cidr
    destination_address_prefix = var.subnet_aks_cidr
  }

  # ── Trafic inter-pods kubenet (pod CIDR → pod CIDR) ───────────
  security_rule {
    name                       = "allow-pod-cidr"
    priority                   = 125
    direction                  = "Inbound"
    access                     = "Allow"
    protocol                   = "*"
    source_port_range          = "*"
    destination_port_range     = "*"
    source_address_prefix      = "10.244.0.0/16"
    destination_address_prefix = "10.244.0.0/16"
  }

  # ── DNS depuis pods ───────────────────────────────────────────
  security_rule {
    name                       = "allow-pods-to-dns"
    priority                   = 126
    direction                  = "Inbound"
    access                     = "Allow"
    protocol                   = "*"
    source_port_range          = "*"
    destination_port_range     = "53"
    source_address_prefix      = "10.244.0.0/16"
    destination_address_prefix = "*"
  }

  # ── Nodes → pods kubenet (routing inter-nœuds) ────────────────
  security_rule {
    name                       = "allow-node-to-pod-cidr"
    priority                   = 128
    direction                  = "Inbound"
    access                     = "Allow"
    protocol                   = "*"
    source_port_range          = "*"
    destination_port_range     = "*"
    source_address_prefix      = var.subnet_aks_cidr
    destination_address_prefix = "10.244.0.0/16"
  }

  # ── Node Exporter (monitoring) ────────────────────────────────
  security_rule {
    name                       = "allow-node-exporter"
    priority                   = 130
    direction                  = "Inbound"
    access                     = "Allow"
    protocol                   = "Tcp"
    source_port_range          = "*"
    destination_port_range     = "9100"
    source_address_prefix      = var.subnet_aks_cidr
    destination_address_prefix = "*"
  }

  # ── Kubelet ───────────────────────────────────────────────────
  security_rule {
    name                       = "allow-kubelet"
    priority                   = 140
    direction                  = "Inbound"
    access                     = "Allow"
    protocol                   = "Tcp"
    source_port_range          = "*"
    destination_port_range     = "10250"
    source_address_prefix      = var.subnet_aks_cidr
    destination_address_prefix = "*"
  }

  # ── etcd ──────────────────────────────────────────────────────
  security_rule {
    name                       = "allow-etcd"
    priority                   = 145
    direction                  = "Inbound"
    access                     = "Allow"
    protocol                   = "Tcp"
    source_port_range          = "*"
    destination_port_range     = "2379-2380"
    source_address_prefix      = var.subnet_aks_cidr
    destination_address_prefix = var.subnet_aks_cidr
  }

  # ── HTTP Ingress ──────────────────────────────────────────────
  security_rule {
    name                       = "allow-http-ingress"
    priority                   = 150
    direction                  = "Inbound"
    access                     = "Allow"
    protocol                   = "Tcp"
    source_port_range          = "*"
    destination_port_range     = "80"
    source_address_prefix      = "Internet"
    destination_address_prefix = "*"
  }

  # ── HTTPS Ingress ─────────────────────────────────────────────
  security_rule {
    name                       = "allow-https-ingress"
    priority                   = 160
    direction                  = "Inbound"
    access                     = "Allow"
    protocol                   = "Tcp"
    source_port_range          = "*"
    destination_port_range     = "443"
    source_address_prefix      = "Internet"
    destination_address_prefix = "*"
  }

  # ── NodePort depuis jumpbox ───────────────────────────────────
  security_rule {
    name                       = "allow-nodeport-from-jumpbox"
    priority                   = 170
    direction                  = "Inbound"
    access                     = "Allow"
    protocol                   = "Tcp"
    source_port_range          = "*"
    destination_port_range     = "30000-32767"
    source_address_prefix      = var.subnet_jumpbox_cidr
    destination_address_prefix = "*"
  }

  # ── Deny all inbound ──────────────────────────────────────────
  security_rule {
    name                       = "deny-all-inbound"
    priority                   = 4096
    direction                  = "Inbound"
    access                     = "Deny"
    protocol                   = "*"
    source_port_range          = "*"
    destination_port_range     = "*"
    source_address_prefix      = "*"
    destination_address_prefix = "*"
  }

  # ── Outbound : pods → tout ────────────────────────────────────
  security_rule {
    name                       = "allow-pods-outbound"
    priority                   = 100
    direction                  = "Outbound"
    access                     = "Allow"
    protocol                   = "*"
    source_port_range          = "*"
    destination_port_range     = "*"
    source_address_prefix      = "10.244.0.0/16"
    destination_address_prefix = "*"
  }

  # ── Outbound : nodes → internet ───────────────────────────────
  security_rule {
    name                       = "allow-outbound-internet"
    priority                   = 110
    direction                  = "Outbound"
    access                     = "Allow"
    protocol                   = "*"
    source_port_range          = "*"
    destination_port_range     = "*"
    source_address_prefix      = "*"
    destination_address_prefix = "Internet"
  }
}

# ══════════════════════════════════════════════════════════════════
# ROUTE TABLE — kubenet inter-node routing
# ══════════════════════════════════════════════════════════════════

resource "azurestack_route_table" "aks" {
  name                = "${var.project_name}-rt-aks"
  location            = local.location
  resource_group_name = local.rg
}

resource "azurestack_route" "pod_cidr_master" {
  name                   = "pod-cidr-master"
  resource_group_name    = local.rg
  route_table_name       = azurestack_route_table.aks.name
  address_prefix         = "10.244.1.0/24"
  next_hop_type          = "VirtualAppliance"
  next_hop_in_ip_address = "10.0.4.100"
}

resource "azurestack_route" "pod_cidr_agent0" {
  name                   = "pod-cidr-agent0"
  resource_group_name    = local.rg
  route_table_name       = azurestack_route_table.aks.name
  address_prefix         = "10.244.2.0/24"
  next_hop_type          = "VirtualAppliance"
  next_hop_in_ip_address = "10.0.4.4"
}

resource "azurestack_route" "pod_cidr_agent1" {
  name                   = "pod-cidr-agent1"
  resource_group_name    = local.rg
  route_table_name       = azurestack_route_table.aks.name
  address_prefix         = "10.244.0.0/24"
  next_hop_type          = "VirtualAppliance"
  next_hop_in_ip_address = "10.0.4.5"
}

# ══════════════════════════════════════════════════════════════════
# NSG ASSOCIATIONS — ARM TEMPLATE
# ══════════════════════════════════════════════════════════════════

resource "azurestack_template_deployment" "nsg_associations" {
  name                = "${var.project_name}-nsg-assoc"
  resource_group_name = local.rg
  deployment_mode     = "Incremental"

  depends_on = [
    azurestack_subnet.jumpbox,
    azurestack_subnet.tools,
    azurestack_subnet.aks,
    azurestack_network_security_group.jumpbox,
    azurestack_network_security_group.tools,
    azurestack_network_security_group.aks,
    azurestack_route_table.aks,
    azurestack_route.pod_cidr_master,
    azurestack_route.pod_cidr_agent0,
    azurestack_route.pod_cidr_agent1,
  ]

  template_body = jsonencode({
    "$schema"      = "https://schema.management.azure.com/schemas/2015-01-01/deploymentTemplate.json#"
    contentVersion = "1.0.0.0"
    resources = [
      {
        type       = "Microsoft.Network/virtualNetworks/subnets"
        apiVersion = "2015-06-15"
        name       = "${azurestack_virtual_network.main.name}/${azurestack_subnet.jumpbox.name}"
        properties = {
          addressPrefix        = var.subnet_jumpbox_cidr
          networkSecurityGroup = { id = azurestack_network_security_group.jumpbox.id }
        }
      },
      {
        type       = "Microsoft.Network/virtualNetworks/subnets"
        apiVersion = "2015-06-15"
        name       = "${azurestack_virtual_network.main.name}/${azurestack_subnet.tools.name}"
        properties = {
          addressPrefix        = var.subnet_tools_cidr
          networkSecurityGroup = { id = azurestack_network_security_group.tools.id }
        }
      },
      {
        type       = "Microsoft.Network/virtualNetworks/subnets"
        apiVersion = "2015-06-15"
        name       = "${azurestack_virtual_network.main.name}/${azurestack_subnet.aks.name}"
        properties = {
          addressPrefix        = var.subnet_aks_cidr
          networkSecurityGroup = { id = azurestack_network_security_group.aks.id }
          routeTable           = { id = azurestack_route_table.aks.id }
        }
      }
    ]
  })
}