#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
API_MODEL="$SCRIPT_DIR/../modules/aks/apimodel.json"
OUTPUT_DIR="$SCRIPT_DIR/../modules/aks/_output"

aks-engine-azurestack deploy \
  --api-model       "$API_MODEL"         \
  --location        "$AKS_LOCATION"      \
  --resource-group  "$AKS_RG"            \
  --subscription-id "$AKS_SUB_ID"        \
  --client-id       "$AKS_CLIENT_ID"     \
  --client-secret   "$AKS_CLIENT_SECRET" \
  --auth-method     client_secret        \
  --azure-env       AzureStackCloud      \
  --identity-system adfs                 \
  --force-overwrite                      \
  --output-directory "$OUTPUT_DIR"