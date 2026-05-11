output "jumpbox_public_ip" {
  value = azurestack_public_ip.jumpbox.ip_address
}

output "jenkins_private_ip" {
  value = azurestack_network_interface.jenkins.private_ip_address
}