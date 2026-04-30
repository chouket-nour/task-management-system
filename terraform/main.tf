data "azurestack_resource_group" "main" {
  name = var.resource_group_name
}

resource "azurestack_virtual_network" "main" {
  name                = "${var.project_name}-vnet"
  address_space       = ["10.0.0.0/16"]
  location            = data.azurestack_resource_group.main.location
  resource_group_name = data.azurestack_resource_group.main.name
}

resource "azurestack_subnet" "main" {
  name                 = "${var.project_name}-subnet"
  resource_group_name  = data.azurestack_resource_group.main.name
  virtual_network_name = azurestack_virtual_network.main.name
  address_prefix       = "10.0.1.0/24"
}

resource "azurestack_network_security_group" "main" {
  name                = "${var.project_name}-nsg"
  location            = data.azurestack_resource_group.main.location
  resource_group_name = data.azurestack_resource_group.main.name

  security_rule {
    name                       = "allow-ssh"
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
    name                       = "allow-k8s-api"
    priority                   = 110
    direction                  = "Inbound"
    access                     = "Allow"
    protocol                   = "Tcp"
    source_port_range          = "*"
    destination_port_range     = "6443"
    source_address_prefix      = "*"
    destination_address_prefix = "*"
  }

  security_rule {
    name                       = "allow-jenkins"
    priority                   = 120
    direction                  = "Inbound"
    access                     = "Allow"
    protocol                   = "Tcp"
    source_port_range          = "*"
    destination_port_range     = "8080"
    source_address_prefix      = "*"
    destination_address_prefix = "*"
  }

  security_rule {
    name                       = "allow-grafana"
    priority                   = 130
    direction                  = "Inbound"
    access                     = "Allow"
    protocol                   = "Tcp"
    source_port_range          = "*"
    destination_port_range     = "3000"
    source_address_prefix      = "*"
    destination_address_prefix = "*"
  }

  security_rule {
    name                       = "allow-prometheus"
    priority                   = 140
    direction                  = "Inbound"
    access                     = "Allow"
    protocol                   = "Tcp"
    source_port_range          = "*"
    destination_port_range     = "9090"
    source_address_prefix      = "*"
    destination_address_prefix = "*"
  }
}

resource "azurestack_public_ip" "vms" {
  count               = 5
  name                = "${var.project_name}-pip-${count.index + 1}"
  location            = data.azurestack_resource_group.main.location
  resource_group_name = data.azurestack_resource_group.main.name
  allocation_method   = "Static"
}

output "test_reseau" {
  value = "Réseau OK ! VNet : ${azurestack_virtual_network.main.name} | Subnet : ${azurestack_subnet.main.name}"
}
resource "azurestack_network_interface" "vms" {
  count               = 5
  name                = "${var.project_name}-nic-${count.index + 1}"
  location            = data.azurestack_resource_group.main.location
  resource_group_name = data.azurestack_resource_group.main.name

  ip_configuration {
    name                          = "ipconfig"
    subnet_id                     = azurestack_subnet.main.id
    private_ip_address_allocation = "Dynamic"
    public_ip_address_id          = azurestack_public_ip.vms[count.index].id
  }
}
resource "azurestack_network_interface_security_group_association" "vms" {
  count                     = 5
  network_interface_id      = azurestack_network_interface.vms[count.index].id
  network_security_group_id = azurestack_network_security_group.main.id
}
output "test_etape2" {
  value = "Etape 2 OK ! PIPs et NICs créés."
}