#!/bin/bash

rm ./dev/kubernetes/local/*

kind delete cluster -n perses-kind

# stop on any future errors
set -e

kind create cluster \
    --config="./dev/kubernetes/kind.yaml" \
    --kubeconfig="./dev/kubernetes/local/kind-admin" \
    --name="perses-kind"

kubectl --kubeconfig=./dev/kubernetes/local/kind-admin apply -f ./dev/kubernetes/manifests/namespaces.yaml

# Create Perses backend service account and token, then save to a new kubeconfig file for
# ease of use
kubectl --kubeconfig=./dev/kubernetes/local/kind-admin create serviceaccount perses-backend --namespace perses
PERSES_BACKEND_TOKEN="$(kubectl --kubeconfig=./dev/kubernetes/local/kind-admin create token perses-backend --namespace perses --duration 8760h)"
kubectl --kubeconfig=./dev/kubernetes/local/kind-admin config set-credentials perses-backend --token=$PERSES_BACKEND_TOKEN
cp ./dev/kubernetes/local/kind-admin ./dev/kubernetes/local/perses-backend
kubectl --kubeconfig=./dev/kubernetes/local/perses-backend config set-context --current --user=perses-backend

# Create a service account "user" which has all permissions related to perses resources
kubectl --kubeconfig=./dev/kubernetes/local/kind-admin create serviceaccount user --namespace perses
USER_TOKEN="$(kubectl --kubeconfig=./dev/kubernetes/local/kind-admin create token user --namespace perses)"

# Install the perses CRD's into the cluster
kubectl --kubeconfig=./dev/kubernetes/local/kind-admin apply -f https://raw.githubusercontent.com/perses/perses-operator/main/config/crd/bases/perses.dev_perses.yaml
kubectl --kubeconfig=./dev/kubernetes/local/kind-admin apply -f https://raw.githubusercontent.com/perses/perses-operator/main/config/crd/bases/perses.dev_persesdashboards.yaml
kubectl --kubeconfig=./dev/kubernetes/local/kind-admin apply -f https://raw.githubusercontent.com/perses/perses-operator/main/config/crd/bases/perses.dev_persesdatasources.yaml
kubectl --kubeconfig=./dev/kubernetes/local/kind-admin apply -f https://raw.githubusercontent.com/perses/perses-operator/main/config/crd/bases/perses.dev_persesglobaldatasources.yaml

# Give the user and perses-backend appropriate permission
kubectl --kubeconfig=./dev/kubernetes/local/kind-admin apply -f ./dev/kubernetes/manifests/perses-backend-permissions.yaml
kubectl --kubeconfig=./dev/kubernetes/local/kind-admin apply -f ./dev/kubernetes/manifests/user-permissions.yaml
