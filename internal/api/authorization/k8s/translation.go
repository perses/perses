// Copyright The Perses Authors
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

package k8s

import (
	v1Role "github.com/perses/perses/pkg/model/api/v1/role"
)

type k8sAction string

const (
	k8sReadAction     k8sAction = "get"
	k8sCreateAction   k8sAction = "create"
	k8sUpdateAction   k8sAction = "patch"
	k8sDeleteAction   k8sAction = "delete"
	k8sWildcardAction k8sAction = "*"
)

type k8sScope string

const (
	k8sWildcardScope         k8sScope = "*"
	k8sDashboardScope        k8sScope = "persesdashboards"
	k8sGlobalDatasourceScope k8sScope = "persesglobaldatasources"
	k8sDatasourceScope       k8sScope = "persesdatasources"
	k8sProjectScope          k8sScope = "namespaces"
	k8sSecretScope           k8sScope = "secrets"
)

// Contains all project-scoped resources that have a corresponding kubernetes resource to
// check against. Used when determining if a user has access to any resource within a namespace
var kubernetesResourcesProjectScopesToCheck = []v1Role.Scope{
	v1Role.DashboardScope,
	v1Role.DatasourceScope,
	v1Role.SecretScope,
}

// projectScopesToCheck contains all project-scoped resources that should be checked per-namespace
// when computing permissions. Used to create full permissions lists
var projectScopesToCheck = append(kubernetesResourcesProjectScopesToCheck,
	v1Role.VariableScope,
	v1Role.EphemeralDashboardScope,
	v1Role.FolderScope,
)

// globalScopesToCheck contains all scopes that should be checked at the wildcard (all-namespace)
// level when computing permissions. This includes both global-only scopes and project-scoped
// resources that benefit from an initial wildcard check to avoid redundant per-namespace checks.
var globalScopesToCheck = append(projectScopesToCheck, v1Role.GlobalDatasourceScope,
	v1Role.GlobalVariableScope,
	v1Role.GlobalSecretScope,
)

// globalScopes contains all resources which are global-scoped (not namespaced).
// When checking permissions for these scopes, the namespace is forced to WildcardProject.
var globalScopes = []v1Role.Scope{
	v1Role.GlobalDatasourceScope,
	v1Role.GlobalVariableScope,
	v1Role.GlobalSecretScope,
}

func getK8sAction(action v1Role.Action) k8sAction {
	switch action {
	case v1Role.ReadAction:
		return k8sReadAction
	case v1Role.CreateAction:
		return k8sCreateAction
	case v1Role.UpdateAction:
		return k8sUpdateAction
	case v1Role.DeleteAction:
		return k8sDeleteAction
	case v1Role.WildcardAction:
		return k8sWildcardAction
	default: // not reachable
		return ""
	}
}

// getK8sScope translates a Perses scope to its corresponding Kubernetes resource name.
// Returns an empty string if the scope has no direct K8s CRD equivalent. In that case,
// checkSpecificPermission falls back to checking the project/namespace permission instead.
func getK8sScope(scope v1Role.Scope) k8sScope {
	switch scope {
	case v1Role.DashboardScope:
		return k8sDashboardScope
	case v1Role.GlobalDatasourceScope:
		return k8sGlobalDatasourceScope
	case v1Role.DatasourceScope:
		return k8sDatasourceScope
	case v1Role.ProjectScope:
		return k8sProjectScope
	case v1Role.WildcardScope:
		return k8sWildcardScope
	case v1Role.SecretScope, v1Role.GlobalSecretScope:
		// Map Perses secrets to native K8s secrets so that accessing Perses secrets
		// requires the user to have K8s secret permissions in the relevant namespace.
		// This is a naive check (not per-secret) but prevents privilege escalation
		// where namespace access alone would grant secret access.
		return k8sSecretScope
	default:
		return "" // Scope doesn't have a k8s equivalent; callers should fall back to project scope
	}
}
