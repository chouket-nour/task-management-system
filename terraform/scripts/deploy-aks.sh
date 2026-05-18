#!/bin/bash
set -euo pipefail

TERRAFORM_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
API_MODEL="$TERRAFORM_DIR/modules/aks/apimodel.json"
OUTPUT_DIR="$TERRAFORM_DIR/modules/aks/_output"

echo "TERRAFORM_DIR : $TERRAFORM_DIR"
echo "API_MODEL     : $API_MODEL"
echo "OUTPUT_DIR    : $OUTPUT_DIR"

mkdir -p "$OUTPUT_DIR"

aks-engine-azurestack deploy \
  --api-model        "$API_MODEL"         \
  --location         "$AKS_LOCATION"      \
  --resource-group   "$AKS_RG"            \
  --subscription-id  "$AKS_SUB_ID"        \
  --client-id        "$AKS_CLIENT_ID"     \
  --client-secret    "$AKS_CLIENT_SECRET" \
  --auth-method      client_secret        \
  --azure-env        AzureStackCloud      \
  --identity-system  adfs                 \
  --force-overwrite                       \
  --output-directory "$OUTPUT_DIR"