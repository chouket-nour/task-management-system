# ══════════════════════════════════════════════════════════════════
# PUBLIC IP — JUMPBOX
# ══════════════════════════════════════════════════════════════════

resource "azurestack_public_ip" "jumpbox" {
  name                = "${var.project_name}-pip-jumpbox"
  location            = var.location
  resource_group_name = var.resource_group_name
  allocation_method   = "Static"
}

# ══════════════════════════════════════════════════════════════════
# NICs
# ══════════════════════════════════════════════════════════════════

resource "azurestack_network_interface" "jumpbox" {
  name                = "${var.project_name}-nic-jumpbox"
  location            = var.location
  resource_group_name = var.resource_group_name

  ip_configuration {
    name                          = "internal"
    subnet_id                     = var.subnet_jumpbox_id
    private_ip_address_allocation = "Static"
    private_ip_address            = var.jumpbox_private_ip
    public_ip_address_id          = azurestack_public_ip.jumpbox.id
    primary                       = true
  }
}

resource "azurestack_network_interface" "jenkins" {
  name                = "${var.project_name}-nic-jenkins"
  location            = var.location
  resource_group_name = var.resource_group_name

  ip_configuration {
    name                          = "internal"
    subnet_id                     = var.subnet_tools_id
    private_ip_address_allocation = "Static"
    private_ip_address            = var.jenkins_private_ip
    primary                       = true
  }
}

# ══════════════════════════════════════════════════════════════════
# VM — JUMPBOX
# ══════════════════════════════════════════════════════════════════

resource "azurestack_virtual_machine" "jumpbox" {
  name                  = "${var.project_name}-vm-jumpbox"
  location              = var.location
  resource_group_name   = var.resource_group_name
  network_interface_ids = [azurestack_network_interface.jumpbox.id]
  vm_size               = var.vm_size_jumpbox

  storage_os_disk {
    name              = "${var.project_name}-osdisk-jumpbox"
    caching           = "ReadWrite"
    create_option     = "FromImage"
    managed_disk_type = "Premium_LRS"
  }

  storage_image_reference {
    publisher = "Canonical"
    offer     = "UbuntuServer"
    sku       = "22.04-LTS"
    version   = "latest"
  }

  os_profile {
    computer_name  = "jumpbox"
    admin_username = var.admin_username
  }

  os_profile_linux_config {
    disable_password_authentication = true
    ssh_keys {
      path     = "/home/${var.admin_username}/.ssh/authorized_keys"
      key_data = var.ssh_public_key
    }
  }

  tags = {
    role    = "jumpbox"
    project = var.project_name
  }
}

# ══════════════════════════════════════════════════════════════════
# VM — JENKINS
# ══════════════════════════════════════════════════════════════════

resource "azurestack_virtual_machine" "jenkins" {
  name                  = "${var.project_name}-vm-jenkins"
  location              = var.location
  resource_group_name   = var.resource_group_name
  network_interface_ids = [azurestack_network_interface.jenkins.id]
  vm_size               = var.vm_size_jenkins

  storage_os_disk {
    name              = "${var.project_name}-osdisk-jenkins"
    caching           = "ReadWrite"
    create_option     = "FromImage"
    managed_disk_type = "Premium_LRS"
  }

  storage_image_reference {
    publisher = "Canonical"
    offer     = "UbuntuServer"
    sku       = "22.04-LTS"
    version   = "latest"
  }

  os_profile {
    computer_name  = "jenkins"
    admin_username = var.admin_username
  }

  os_profile_linux_config {
    disable_password_authentication = true
    ssh_keys {
      path     = "/home/${var.admin_username}/.ssh/authorized_keys"
      key_data = var.ssh_public_key
    }
  }

  storage_data_disk {
    name              = "${var.project_name}-datadisk-jenkins"
    managed_disk_type = "Premium_LRS"
    create_option     = "Empty"
    lun               = 0
    disk_size_gb      = 100
  }

  tags = {
    role    = "jenkins"
    project = var.project_name
  }
}
