// Copyright 2025 The Perses Authors
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
	k8sWildcardScope   k8sScope = "*"
	k8sDashboardScope  k8sScope = "persesdashboards"
	k8sDatasourceScope k8sScope = "persesdatasources"
	k8sProjectScope    k8sScope = "namespaces"
)

var k8sScopesToCheck = [2]k8sScope{
	k8sDashboardScope,
	k8sDatasourceScope,
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

func getPersesAction(action k8sAction) v1Role.Action {
	switch action {
	case k8sReadAction:
		return v1Role.ReadAction
	case k8sCreateAction:
		return v1Role.CreateAction
	case k8sUpdateAction:
		return v1Role.UpdateAction
	case k8sDeleteAction:
		return v1Role.DeleteAction
	case k8sWildcardAction:
		return v1Role.WildcardAction
	default: // not reachable
		return ""
	}
}

// GetScope parse string to Scope (not case-sensitive)
func getK8sScope(scope v1Role.Scope) k8sScope {
	switch scope {
	case v1Role.DashboardScope:
		return k8sDashboardScope
	case v1Role.DatasourceScope:
		return k8sDatasourceScope
	case v1Role.ProjectScope:
		return k8sProjectScope
	case v1Role.WildcardScope:
		return k8sWildcardScope
	default:
		return "" // Non-K8s Scope, use guest permissions
	}
}

// GetScope parse string to Scope (not case-sensitive)
func getPersesScope(scope k8sScope) v1Role.Scope {
	switch scope {
	case k8sDashboardScope:
		return v1Role.DashboardScope
	case k8sDatasourceScope:
		return v1Role.DatasourceScope
	case k8sProjectScope:
		return v1Role.ProjectScope
	case k8sWildcardScope:
		return v1Role.WildcardScope
	default: // not reachable
		return ""
	}
}
