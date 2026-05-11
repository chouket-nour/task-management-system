output "subnet_jumpbox_id" {
  value = azurestack_subnet.jumpbox.id
}

output "subnet_tools_id" {
  value = azurestack_subnet.tools.id
}

output "subnet_aks_id" {
  value = azurestack_subnet.aks.id
}

output "vnet_name" {
  value = azurestack_virtual_network.main.name
}