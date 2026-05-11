
# ── Outputs network ───────────────────────────────────────────────
output "vnet_name" {
  value = module.network.vnet_name
}

output "subnet_aks_id" {
  value = module.network.subnet_aks_id
}

output "subnet_tools_id" {
  value = module.network.subnet_tools_id
}

output "subnet_jumpbox_id" {
  value = module.network.subnet_jumpbox_id
}

# ── Outputs vm ────────────────────────────────────────────────────
output "jumpbox_public_ip" {
  value = module.vm.jumpbox_public_ip
}

output "jenkins_private_ip" {
  value = module.vm.jenkins_private_ip
}