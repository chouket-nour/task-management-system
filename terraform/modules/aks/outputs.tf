output "kubeconfig_path" {
  value       = "${path.module}/_output/${var.dns_prefix}/kubeconfig/kubeconfig.${var.location}.json"
  description = "Chemin vers le kubeconfig généré"
}

output "master_ip" {
  value       = "10.0.1.5"
  description = "IP privée du master K8s"
}