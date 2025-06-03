// Copyright 2023 The Perses Authors
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

package rbac

import (
	"context"
	"slices"

	"github.com/labstack/echo/v4"
	"github.com/perses/perses/internal/api/crypto"
	"github.com/perses/perses/internal/api/interface/v1/user"

	v1Role "github.com/perses/perses/pkg/model/api/v1/role"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"

	"k8s.io/apiserver/pkg/authorization/authorizer"

	"k8s.io/client-go/kubernetes"
)

type K8sImpl struct {
	userDAO          user.DAO
	guestPermissions []*v1Role.Permission
	Security         *crypto.K8sSecurity
	kubeClient       *kubernetes.Clientset
}

type K8sAction string

const (
	K8sReadAction     K8sAction = "get"
	K8sCreateAction   K8sAction = "create"
	K8sUpdateAction   K8sAction = "patch"
	K8sDeleteAction   K8sAction = "delete"
	K8sWildcardAction K8sAction = "*"
)

var K8sActions = [5]K8sAction{
	K8sReadAction,
	K8sWildcardAction,
	K8sCreateAction,
	K8sUpdateAction,
	K8sDeleteAction,
}

type K8sScope string

const (
	K8sWildcardScope   K8sScope = "*"
	K8sDashboardScope  K8sScope = "PersesDashboard"
	K8sDatasourceScope K8sScope = "PersesDatasource"
	K8sProjectScope    K8sScope = "Namespace"
)

var K8sScopesToCheck = [2]K8sScope{
	K8sDashboardScope,
	K8sDatasourceScope,
}

func createK8sImpl(security crypto.Security, userDAO user.DAO, guestPermissions []*v1Role.Permission) *K8sImpl {
	k8sSecurity, ok := security.(*crypto.K8sSecurity)
	if !ok {
		return nil
	}

	kubeClient, err := kubernetes.NewForConfig(k8sSecurity.Kubeconfig)
	if err != nil {
		return nil
	}

	return &K8sImpl{
		userDAO:          userDAO,
		guestPermissions: guestPermissions,
		kubeClient:       kubeClient,
		Security:         k8sSecurity,
	}
}

func (r K8sImpl) IsEnabled() bool {
	return true
}

func (r K8sImpl) GetUserProjects(ctx echo.Context, _ string, requestAction v1Role.Action, requestScope v1Role.Scope) []string {
	user, err := r.Security.GetK8sUser(ctx)
	if err != nil {
		return []string{}
	}
	scope := getK8sScope(requestScope)
	action := getK8sAction(requestAction)
	namespaces := r.getNamespaceList()
	permittedNamespaces := []string{}

	for _, namespace := range namespaces {
		attributes := authorizer.AttributesRecord{
			User:            user,
			Verb:            string(action),
			Namespace:       namespace,
			APIGroup:        "perses.dev",
			APIVersion:      "v1alpha1",
			Resource:        string(scope),
			Subresource:     "",
			Name:            "",
			ResourceRequest: false,
		}

		authorized, _, _ := r.Security.Authorizer.Authorize(ctx.Request().Context(), attributes)
		if authorized == authorizer.DecisionAllow {
			permittedNamespaces = append(permittedNamespaces, namespace)
		}
	}

	return permittedNamespaces
}

func (r K8sImpl) HasPermission(ctx echo.Context, _ string, requestAction v1Role.Action, requestProject string, requestScope v1Role.Scope) bool {
	user, err := r.Security.GetK8sUser(ctx)
	if err != nil {
		return false
	}

	scope := getK8sScope(requestScope)
	if scope == "" {
		// The permission isn't k8s related, default to using guest permissions
		return permissionListHasPermission(r.guestPermissions, requestAction, requestScope)
	}

	action := getK8sAction(requestAction)

	// Try checking the specific project for access
	// If the namespace doesn't exist in k8s, the authorizer will return the "*" permissions
	attributes := authorizer.AttributesRecord{
		User:            user,
		Verb:            string(action),
		Namespace:       requestProject,
		APIGroup:        "perses.dev",
		APIVersion:      "v1alpha1",
		Resource:        string(scope),
		Subresource:     "",
		Name:            "",
		ResourceRequest: false,
	}

	authorized, _, _ := r.Security.Authorizer.Authorize(ctx.Request().Context(), attributes)

	return authorized == authorizer.DecisionAllow
}

func (r K8sImpl) GetPermissions(ctx echo.Context, _ string) map[string][]*v1Role.Permission {
	user, err := r.Security.GetK8sUser(ctx)
	if err != nil {
		return nil
	}

	userPermissions := make(map[string][]*v1Role.Permission)
	userPermissions[GlobalProject] = r.guestPermissions

	namespaces := r.getNamespaceList()

scope:
	for _, k8sScope := range K8sScopesToCheck {
		// Contains the actions which need to be checked every loop. If action is permitted
		// at the global scope then we don't need to check within the namespace scope
		// Since each permission check is a network round trip, it is best to optimize
		// the logic to reduce the number of permission checks we make
		actionsToCheck := []K8sAction{
			K8sWildcardAction,
			K8sReadAction,
			K8sCreateAction,
			K8sUpdateAction,
			K8sDeleteAction,
		}
	project:
		for _, k8sProject := range namespaces {
			scopeActions, ok := userPermissions[k8sProject]
			if ok {
				scopeActions = append(scopeActions, &v1Role.Permission{
					Scopes:  []v1Role.Scope{getPersesScope(k8sScope)},
					Actions: []v1Role.Action{},
				})
			} else {
				scopeActions = []*v1Role.Permission{{
					Scopes:  []v1Role.Scope{getPersesScope(k8sScope)},
					Actions: []v1Role.Action{},
				}}

			}
			permissionIndex := len(scopeActions) - 1

		action:
			for _, k8sAction := range actionsToCheck {
				attributes := authorizer.AttributesRecord{
					User:            user,
					Verb:            string(k8sAction),
					Namespace:       k8sProject,
					APIGroup:        "perses.dev",
					APIVersion:      "v1alpha1",
					Resource:        string(getPersesScope(k8sScope)),
					Subresource:     "",
					Name:            "",
					ResourceRequest: false,
				}

				authorized, _, err := r.Security.Authorizer.Authorize(ctx.Request().Context(), attributes)
				if err != nil {
					// If the request errors, then assume the rest of the requests will also error and break
					// out early
					break project
				}

				if k8sAction == K8sWildcardAction {
					if authorized == authorizer.DecisionAllow {
						scopeActions[permissionIndex].Actions = append(scopeActions[permissionIndex].Actions, getPersesAction(K8sWildcardAction))
						if k8sProject == GlobalProject {
							userPermissions[k8sProject] = scopeActions
							break project
							// User has all permissions for this scope, no need
							// to check other namespaces or permissions
						}
						// User has all permissions for this namespace, no need
						// to check other permissions
						break action
					}
				}

				if k8sAction == K8sReadAction && authorized == authorizer.DecisionDeny {
					// User can't even read the resource, no need to check the rest
					break scope
				}

				if authorized == authorizer.DecisionAllow && slices.Contains([]K8sAction{
					K8sReadAction,
					K8sCreateAction,
					K8sUpdateAction,
					K8sDeleteAction,
				}, k8sAction) {
					scopeActions[permissionIndex].Actions = append(scopeActions[permissionIndex].Actions, getPersesAction(k8sAction))
					if k8sProject == GlobalProject {
						actionsToCheck = slices.DeleteFunc(actionsToCheck, func(actionToCheck K8sAction) bool {
							return actionToCheck == k8sAction
						})
						if len(actionsToCheck) == 1 {
							// User has all permissions except for wildcard for this scope, no need
							// to check the other namespaces or permissions
							userPermissions[k8sProject] = scopeActions
							break project
						}
					}
				}
			}
			// Check if any actions are permitted for the user for the
			// given project
			if len(scopeActions[permissionIndex].Actions) > 0 {
				userPermissions[k8sProject] = scopeActions
			}
		}
	}

	return userPermissions
}

func (r K8sImpl) Refresh() error {
	return nil
}

func (r K8sImpl) getNamespaceList() []string {
	k8sNamespaces, err := r.kubeClient.CoreV1().Namespaces().
		List(context.Background(), metav1.ListOptions{})
	if err != nil {
		return []string{}
	}

	namespaces := []string{GlobalProject}

	for _, namespace := range k8sNamespaces.Items {
		namespaces = append(namespaces, namespace.Name)
	}

	return namespaces
}

func getK8sAction(action v1Role.Action) K8sAction {
	switch action {
	case v1Role.ReadAction:
		return K8sReadAction
	case v1Role.CreateAction:
		return K8sCreateAction
	case v1Role.UpdateAction:
		return K8sUpdateAction
	case v1Role.DeleteAction:
		return K8sDeleteAction
	case v1Role.WildcardAction:
		return K8sWildcardAction
	default: // not reachable
		return ""
	}
}

func getPersesAction(action K8sAction) v1Role.Action {
	switch action {
	case K8sReadAction:
		return v1Role.ReadAction
	case K8sCreateAction:
		return v1Role.CreateAction
	case K8sUpdateAction:
		return v1Role.UpdateAction
	case K8sDeleteAction:
		return v1Role.DeleteAction
	case K8sWildcardAction:
		return v1Role.WildcardAction
	default: // not reachable
		return ""
	}
}

// GetScope parse string to Scope (not case-sensitive)
func getK8sScope(scope v1Role.Scope) K8sScope {
	switch scope {
	case v1Role.DashboardScope:
		return K8sDashboardScope
	case v1Role.DatasourceScope:
		return K8sDatasourceScope
	case v1Role.ProjectScope:
		return K8sProjectScope
	case v1Role.WildcardScope:
		return K8sWildcardScope
	default:
		return "" // Non-K8s Scope, use guest permissions
	}
}

// GetScope parse string to Scope (not case-sensitive)
func getPersesScope(scope K8sScope) v1Role.Scope {
	switch scope {
	case K8sDashboardScope:
		return v1Role.DashboardScope
	case K8sDatasourceScope:
		return v1Role.DatasourceScope
	case K8sProjectScope:
		return v1Role.ProjectScope
	case K8sWildcardScope:
		return v1Role.WildcardScope
	default: // not reachable
		return ""
	}
}
