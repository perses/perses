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

package authorization

import (
	"context"
	"errors"
	"fmt"
	"net/http"
	"slices"
	"time"

	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
	"github.com/perses/perses/internal/api/authorization/native"
	"github.com/perses/perses/internal/api/utils"
	"github.com/perses/perses/pkg/model/api/config"
	v1 "github.com/perses/perses/pkg/model/api/v1"
	v1Role "github.com/perses/perses/pkg/model/api/v1/role"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	authenticationclient "k8s.io/client-go/kubernetes/typed/authentication/v1"
	authorizationclient "k8s.io/client-go/kubernetes/typed/authorization/v1"

	apiInterface "github.com/perses/perses/internal/api/interface"
	"k8s.io/apiserver/pkg/apis/apiserver"
	"k8s.io/apiserver/pkg/authentication/authenticator"
	"k8s.io/apiserver/pkg/authentication/authenticatorfactory"
	"k8s.io/apiserver/pkg/authentication/user"
	"k8s.io/apiserver/pkg/authorization/authorizer"
	"k8s.io/apiserver/pkg/authorization/authorizerfactory"
	"k8s.io/apiserver/pkg/server/options"

	"k8s.io/client-go/kubernetes"
	"k8s.io/client-go/rest"
	"k8s.io/client-go/tools/clientcmd"
)

func NewK8sAuthz(conf config.Config) (*k8sImpl, error) {
	if !conf.Security.Authorization.Providers.Kubernetes.Enabled {
		return nil, fmt.Errorf("kubernetes authorization is not enabled")
	}
	kubeconfig, err := InitKubeConfig(conf.Security.Authorization.Providers.Kubernetes.Kubeconfig)
	if err != nil {
		return nil, err
	}

	// Since the Authenticator will need to make a lot of requests to check all permissions, raise the
	// default limits
	kubeconfig.QPS = 500
	kubeconfig.Burst = 1000

	kubeClient, err := kubernetes.NewForConfig(kubeconfig)
	if err != nil {
		return nil, nil
	}

	sarClient := kubeClient.AuthorizationV1()
	authorizer, err := newAuthorizer(sarClient)
	if err != nil {
		return nil, nil
	}

	tokenClient := kubeClient.AuthenticationV1()
	kubernetesAuthenticator, err := newAuthenticator(
		tokenClient,
	)
	if err != nil {
		return nil, nil
	}

	return &k8sImpl{
		Authenticator:    kubernetesAuthenticator,
		Authorizer:       authorizer,
		Kubeconfig:       kubeconfig,
		kubeClient:       kubeClient,
		guestPermissions: conf.Security.Authorization.GuestPermissions,
	}, nil
}

type k8sImpl struct {
	Authenticator    authenticator.Request
	Authorizer       authorizer.Authorizer
	Kubeconfig       *rest.Config
	kubeClient       *kubernetes.Clientset
	guestPermissions []*v1Role.Permission
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
	K8sDashboardScope  K8sScope = "persesdashboards"
	K8sDatasourceScope K8sScope = "persesdatasources"
	K8sProjectScope    K8sScope = "namespaces"
)

var K8sScopesToCheck = [2]K8sScope{
	K8sDashboardScope,
	K8sDatasourceScope,
}

type k8sUser struct {
	UserInfo user.Info
}

// IsEnabled implements [Authorization]
func (k *k8sImpl) IsEnabled() bool {
	return true
}

// GetUser implements [Authorization]
func (k *k8sImpl) GetUser(ctx echo.Context) (any, error) {
	// Context can be nil when the function is called outside the request context.
	// For example, the provisioning service is calling every service without any context.
	if ctx == nil {
		return nil, nil
	}

	if utils.IsAnonymous(ctx) {
		return nil, nil
	}

	// At this point, we are sure that the context is not nil and the user is not anonymous.
	// The user token is expected to be set in the Authorization header
	req := ctx.Request().Clone(ctx.Request().Context())

	// req.Header.Set("Authorization", GetAuthnHeaderFromClient(ctx, k.Kubeconfig))
	res, ok, err := k.Authenticator.AuthenticateRequest(req)
	if err != nil {
		return nil, err
	} else if !ok {
		return nil, fmt.Errorf("request unable to be authenticated")
	}

	return k8sUser{UserInfo: res.User}, nil
}

// GetUsername implements [Authorization]
func (k *k8sImpl) GetUsername(ctx echo.Context) (string, error) {
	user, err := k.GetUser(ctx)
	if err != nil {
		return "", err
	}
	if user == nil {
		return "", nil // No user found in the context, this is an anonymous endpoint
	}
	if k8sUser, ok := user.(k8sUser); ok {
		return k8sUser.UserInfo.GetName(), nil
	}
	return "", apiInterface.InternalError
}

// Middleware implements [Authorization]
func (k *k8sImpl) Middleware(skipper middleware.Skipper) echo.MiddlewareFunc {
	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(ctx echo.Context) error {
			if skipper(ctx) {
				return next(ctx)
			}
			_, err := k.GetUser(ctx)
			if err != nil {
				return ctx.JSON(http.StatusUnauthorized, "invalid authorization header")
			}

			return next(ctx)
		}
	}
}

// GetUserProjects implements [Authorization]
func (k *k8sImpl) GetUserProjects(ctx echo.Context, requestAction v1Role.Action, requestScope v1Role.Scope) ([]string, error) {

	if utils.IsAnonymous(ctx) {
		// This method should not be called if the endpoint is anonymous or the username is not found.
		return nil, apiInterface.InternalError
	}

	user, err := k.GetUser(ctx)
	if err != nil {
		return nil, err
	}

	kubernetesUser, err := GetK8sUser(user)
	if err != nil {
		return nil, err
	}

	k8sNamespaces := k.getNamespaceList()

	authorizedNamespaces := []string{}

	for _, k8sNamespace := range k8sNamespaces {
		if k.checkNamespacePermission(ctx, k8sNamespace, kubernetesUser) {
			authorizedNamespaces = append(authorizedNamespaces, k8sNamespace)
		}
	}

	return authorizedNamespaces, nil
}

// HasPermission implements [Authorization]
func (k k8sImpl) HasPermission(ctx echo.Context, requestAction v1Role.Action, requestProject string, requestScope v1Role.Scope) bool {
	// If the context is nil, it means the function is called internally without a request context.
	// And in this case, we assume we want to bypass the authorization check.
	if ctx == nil {
		return true
	}
	if utils.IsAnonymous(ctx) {
		// If the endpoint is anonymous, we allow the request to pass through.
		return true
	}

	user, err := k.GetUser(ctx)
	if err != nil {
		return false
	}

	kubernetesUser, err := GetK8sUser(user)
	if err != nil {
		return false
	}

	scope := getK8sScope(requestScope)
	if scope == "" {
		// The permission isn't k8s related, default to using guest permissions
		return native.ListHasPermission(k.guestPermissions, requestAction, requestScope)
	}

	action := getK8sAction(requestAction)
	apiGroup := getK8sAPIGroup(scope)
	apiVersion := getK8sAPIVersion(scope)

	// Try checking the specific project for access
	// If the namespace doesn't exist in k8s, the authorizer will return the "*" permissions
	attributes := authorizer.AttributesRecord{
		User:            kubernetesUser,
		Verb:            string(action),
		Namespace:       requestProject,
		APIGroup:        apiGroup,
		APIVersion:      apiVersion,
		Resource:        string(scope),
		Subresource:     "",
		Name:            "",
		ResourceRequest: true,
	}

	authorized, _, _ := k.Authorizer.Authorize(ctx.Request().Context(), attributes)

	return authorized == authorizer.DecisionAllow
}

// GetPermissions implements [Authorization]
func (k k8sImpl) GetPermissions(ctx echo.Context) (map[string][]*v1Role.Permission, error) {
	// If the context is nil, it means the function is called internally without a request context.
	// This function should not be called for such a case
	if ctx == nil {
		return nil, apiInterface.InternalError
	}
	if utils.IsAnonymous(ctx) {
		// If the endpoint is anonymous, however without a user we cannot determine their permissions.
		// This function should not be called without a user
		return nil, apiInterface.InternalError
	}
	user, err := k.GetUser(ctx)
	if err != nil {
		return nil, err
	}
	if user == nil {
		// The user is unable to be found for the request, however without a user we cannot determine
		// their permissions
		return nil, apiInterface.InternalError
	}

	kubernetesUser, err := GetK8sUser(user)
	if err != nil {
		return nil, err
	}

	userPermissions := make(map[string][]*v1Role.Permission)
	userPermissions[v1.WildcardProject] = k.guestPermissions

	namespaces := k.getNamespaceList()

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
		apiGroup := getK8sAPIGroup(k8sScope)
		apiVersion := getK8sAPIVersion(k8sScope)
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
					User:            kubernetesUser,
					Verb:            string(k8sAction),
					Namespace:       k8sProject,
					APIGroup:        apiGroup,
					APIVersion:      apiVersion,
					Resource:        string(getPersesScope(k8sScope)),
					Subresource:     "",
					Name:            "",
					ResourceRequest: true,
				}

				authorized, _, err := k.Authorizer.Authorize(ctx.Request().Context(), attributes)
				if err != nil {
					// If the request errors, then assume the rest of the requests will also error and break
					// out early
					break project
				}

				if k8sAction == K8sWildcardAction {
					if authorized == authorizer.DecisionAllow {
						scopeActions[permissionIndex].Actions = append(scopeActions[permissionIndex].Actions, getPersesAction(K8sWildcardAction))
						if k8sProject == v1.WildcardProject {
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
					if k8sProject == v1.WildcardProject {
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

	return userPermissions, nil
}

// RefreshPermissions implements [Authorization]
func (k *k8sImpl) RefreshPermissions() error {
	return nil
}

func (k *k8sImpl) checkNamespacePermission(ctx echo.Context, namespace string, user user.Info) bool {
	if namespace == "perses" {
		println("yaba")
	}

	// rather than checking if the user has access to the namespace, we check if the user has access
	// to any of the perses scopes within the namespace, since namespaces which the user has access to
	// but cannot view perses scopes are irrelevant
	for _, k8sScope := range K8sScopesToCheck {
		attributes := authorizer.AttributesRecord{
			User:            user,
			Verb:            string(K8sReadAction),
			Namespace:       namespace,
			APIGroup:        "perses.dev",
			APIVersion:      "v1alpha1",
			Resource:        string(k8sScope),
			Subresource:     "",
			Name:            "",
			ResourceRequest: true,
		}

		// don't need to check bool or error since if the authorized isn't allow then all other instances
		// mean failure
		authorized, _, _ := k.Authorizer.Authorize(ctx.Request().Context(), attributes)
		if authorized == authorizer.DecisionAllow {
			return true
		}
	}

	return false
}

func (k *k8sImpl) getNamespaceList() []string {
	k8sNamespaces, err := k.kubeClient.CoreV1().Namespaces().
		List(context.Background(), metav1.ListOptions{})
	if err != nil {
		return []string{}
	}

	namespaces := []string{v1.WildcardProject}

	for _, namespace := range k8sNamespaces.Items {
		namespaces = append(namespaces, namespace.Name)
	}

	return namespaces
}

// Returns initialized config, allows local usage (outside cluster) based on provided kubeconfig or in-cluster
// service account usage
func InitKubeConfig(kcLocation string) (*rest.Config, error) {
	if kcLocation != "" {
		kubeConfig, err := clientcmd.BuildConfigFromFlags("", kcLocation)
		if err != nil {
			return nil, fmt.Errorf("unable to build rest config based on provided path to kubeconfig file: %w", err)
		}
		return kubeConfig, nil
	}

	kubeConfig, err := rest.InClusterConfig()
	if err != nil {
		return nil, fmt.Errorf("cannot find Service Account in pod to build in-cluster rest config: %w", err)
	}

	return kubeConfig, nil
}

/*
 * These functions are used to retrieve the Authorization Header from the current state of the
 * request and the server configuration. These are used for local development of perses, enabling
 * the usage of the frontend without the need to define and forward a token from the frontend
 */
func GetAuthnHeaderFromLocation(ctx echo.Context, kcLocation string) string {
	if len(kcLocation) == 0 {
		return ctx.Request().Header.Get("Authorization")
	}
	kubeconfig, err := InitKubeConfig(kcLocation)
	if err != nil {
		return ""
	}
	return fmt.Sprintf("bearer %s", kubeconfig.BearerToken)
}

func GetAuthnHeaderFromClient(ctx echo.Context, kubeconfig *rest.Config) string {
	if kubeconfig == nil {
		return ctx.Request().Header.Get("Authorization")
	}
	return fmt.Sprintf("bearer %s", kubeconfig.BearerToken)
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

// GetScope parse string to Scope (not case-sensitive)
func getK8sAPIVersion(scope K8sScope) string {
	switch scope {
	case K8sProjectScope:
		return "v1"
	default:
		return "v1alpha1"
	}
}

// GetScope parse string to Scope (not case-sensitive)
func getK8sAPIGroup(scope K8sScope) string {
	switch scope {
	case K8sProjectScope:
		return ""
	default:
		return "perses.dev"
	}
}

func GetK8sUser(user any) (user.Info, error) {
	if k8sUser, ok := user.(k8sUser); ok {
		return k8sUser.UserInfo, nil
	}
	return nil, fmt.Errorf("unable to convert struct to k8s user")
}

// NewSarAuthorizer creates an authorizer compatible with the kubelet's needs
func newAuthorizer(client authorizationclient.AuthorizationV1Interface) (authorizer.Authorizer, error) {
	if client == nil {
		return nil, errors.New("no client provided, cannot use webhook authorization")
	}
	authorizerConfig := authorizerfactory.DelegatingAuthorizerConfig{
		SubjectAccessReviewClient: client,
		AllowCacheTTL:             5 * time.Second,
		DenyCacheTTL:              5 * time.Second,
		WebhookRetryBackoff:       options.DefaultAuthWebhookRetryBackoff(),
	}
	return authorizerConfig.New()
}

// newKubernetesAuthenticator creates an authenticator compatible with the kubelets needs
func newAuthenticator(client authenticationclient.AuthenticationV1Interface) (authenticator.Request, error) {
	if client == nil {
		return nil, errors.New("tokenAccessReview client not provided, cannot use webhook authentication")
	}

	authenticatorConfig := authenticatorfactory.DelegatingAuthenticatorConfig{
		Anonymous: &apiserver.AnonymousAuthConfig{
			Enabled: false, // always require authentication
		},
		CacheTTL:                2 * time.Second,
		TokenAccessReviewClient: client,
		WebhookRetryBackoff:     options.DefaultAuthWebhookRetryBackoff(),
	}

	authenticator, _, err := authenticatorConfig.New()
	if err != nil {
		return nil, err
	}
	return authenticator, nil
}
