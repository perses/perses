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
	"context"
	"errors"
	"fmt"
	"reflect"
	"slices"
	"time"

	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
	apiInterface "github.com/perses/perses/internal/api/interface"
	"github.com/perses/perses/internal/api/utils"
	"github.com/perses/perses/pkg/model/api/config"
	v1 "github.com/perses/perses/pkg/model/api/v1"
	v1Role "github.com/perses/perses/pkg/model/api/v1/role"
	"github.com/sirupsen/logrus"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apiserver/pkg/apis/apiserver"
	"k8s.io/apiserver/pkg/authentication/authenticator"
	"k8s.io/apiserver/pkg/authentication/authenticatorfactory"
	"k8s.io/apiserver/pkg/authentication/user"
	"k8s.io/apiserver/pkg/authorization/authorizer"
	"k8s.io/apiserver/pkg/authorization/authorizerfactory"
	"k8s.io/apiserver/pkg/server/options"
	"k8s.io/client-go/kubernetes"
	authenticationclient "k8s.io/client-go/kubernetes/typed/authentication/v1"
	authorizationclient "k8s.io/client-go/kubernetes/typed/authorization/v1"
	"k8s.io/client-go/rest"
	"k8s.io/client-go/tools/clientcmd"
)

func New(conf config.Config) (*k8sImpl, error) {
	if !conf.Security.Authorization.Provider.Kubernetes.Enable {
		return nil, fmt.Errorf("kubernetes authorization is not enabled")
	}
	kubeconfig, err := initKubeConfig(conf.Security.Authorization.Provider.Kubernetes.Kubeconfig)
	if err != nil {
		return nil, err
	}

	kubeconfig.QPS = float32(conf.Security.Authorization.Provider.Kubernetes.QPS)
	kubeconfig.Burst = conf.Security.Authorization.Provider.Kubernetes.Burst

	kubeClient, err := kubernetes.NewForConfig(kubeconfig)
	if err != nil {
		return nil, nil
	}

	sarClient := kubeClient.AuthorizationV1()
	authorizer, err := newAuthorizer(sarClient, conf.Security.Authorization.Provider.Kubernetes)
	if err != nil {
		return nil, nil
	}

	tokenClient := kubeClient.AuthenticationV1()
	kubernetesAuthenticator, err := newAuthenticator(
		tokenClient,
		conf.Security.Authorization.Provider.Kubernetes,
	)
	if err != nil {
		return nil, nil
	}

	return &k8sImpl{
		authenticator: kubernetesAuthenticator,
		authorizer:    authorizer,
		kubeconfig:    kubeconfig,
		kubeClient:    kubeClient,
	}, nil
}

type k8sImpl struct {
	authenticator authenticator.Request
	authorizer    authorizer.Authorizer
	kubeconfig    *rest.Config
	kubeClient    *kubernetes.Clientset
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

	res, ok, err := k.authenticator.AuthenticateRequest(req)
	if err != nil {
		return nil, err
	} else if !ok {
		return nil, fmt.Errorf("request unable to be authenticated")
	}

	return res.User, nil
}

// GetUsername implements [Authorization]
func (k *k8sImpl) GetUsername(ctx echo.Context) (string, error) {
	userStruct, err := k.GetUser(ctx)
	if err != nil {
		return "", err
	}
	if userStruct == nil {
		return "", nil // No user found in the context, this is an anonymous endpoint
	}
	k8sUser, err := getK8sUser(userStruct)
	if err != nil {
		// this case should not happen, as the getK8sUser function should just be used to unwrap any
		// into the appropriate struct
		return "", err
	}
	return k8sUser.GetName(), nil
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
				return apiInterface.HandleUnauthorizedError("invalid authorization header")
			}

			return next(ctx)
		}
	}
}

// GetUserProjects implements [Authorization]
func (k *k8sImpl) GetUserProjects(ctx echo.Context, requestAction v1Role.Action, requestScope v1Role.Scope) ([]string, error) {
	if utils.IsAnonymous(ctx) {
		// This method should not be called if the endpoint is anonymous or the username is not found.
		logrus.Error("failed to get username from context to list the user projects")
		return nil, apiInterface.InternalError
	}

	user, err := k.GetUser(ctx)
	if err != nil {
		return nil, err
	}

	kubernetesUser, err := getK8sUser(user)
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

	kubernetesUser, err := getK8sUser(user)
	if err != nil {
		return false
	}

	scope := getK8sScope(requestScope)
	if scope == "" {
		// The permission isn't k8s related, default to false for now
		return false
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

	authorized, _, _ := k.authorizer.Authorize(ctx.Request().Context(), attributes)

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

	kubernetesUser, err := getK8sUser(user)
	if err != nil {
		return nil, err
	}

	userPermissions := make(map[string][]*v1Role.Permission)

	namespaces := k.getNamespaceList()

scope:
	for _, k8sScope := range k8sScopesToCheck {
		// Contains the actions which need to be checked every loop. If action is permitted
		// at the global scope then we don't need to check within the namespace scope
		// Since each permission check is a network round trip, it is best to optimize
		// the logic to reduce the number of permission checks we make
		actionsToCheck := []k8sAction{
			k8sWildcardAction,
			k8sReadAction,
			k8sCreateAction,
			k8sUpdateAction,
			k8sDeleteAction,
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
			for _, k8sActionToCheck := range actionsToCheck {
				attributes := authorizer.AttributesRecord{
					User:            kubernetesUser,
					Verb:            string(k8sActionToCheck),
					Namespace:       k8sProject,
					APIGroup:        apiGroup,
					APIVersion:      apiVersion,
					Resource:        string(getPersesScope(k8sScope)),
					Subresource:     "",
					Name:            "",
					ResourceRequest: true,
				}

				authorized, _, err := k.authorizer.Authorize(ctx.Request().Context(), attributes)
				if err != nil {
					// If the request errors, then assume the rest of the requests will also error and break
					// out early
					break project
				}

				if k8sActionToCheck == k8sWildcardAction {
					if authorized == authorizer.DecisionAllow {
						scopeActions[permissionIndex].Actions = append(scopeActions[permissionIndex].Actions, getPersesAction(k8sWildcardAction))
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

				if k8sActionToCheck == k8sReadAction && authorized == authorizer.DecisionDeny {
					// User can't even read the resource, no need to check the rest
					break scope
				}

				if authorized == authorizer.DecisionAllow && slices.Contains([]k8sAction{
					k8sReadAction,
					k8sCreateAction,
					k8sUpdateAction,
					k8sDeleteAction,
				}, k8sActionToCheck) {
					scopeActions[permissionIndex].Actions = append(scopeActions[permissionIndex].Actions, getPersesAction(k8sActionToCheck))
					if k8sProject == v1.WildcardProject {
						actionsToCheck = slices.DeleteFunc(actionsToCheck, func(actionToCheck k8sAction) bool {
							return actionToCheck == k8sActionToCheck
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
	// rather than checking if the user has access to the namespace, we check if the user has access
	// to any of the perses scopes within the namespace, since namespaces which the user has access to
	// but cannot view perses scopes are irrelevant
	for _, k8sScope := range k8sScopesToCheck {
		attributes := authorizer.AttributesRecord{
			User:            user,
			Verb:            string(k8sReadAction),
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
		authorized, _, _ := k.authorizer.Authorize(ctx.Request().Context(), attributes)
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
func initKubeConfig(kcLocation string) (*rest.Config, error) {
	if kcLocation != "" {
		kubeConfig, err := clientcmd.BuildConfigFromFlags("", kcLocation)
		if err != nil {
			return nil, fmt.Errorf("unable to build rest config based on provided path to kubeconfig file: %w", err)
		}
		return kubeConfig, nil
	}

	kubeConfig, err := rest.InClusterConfig()
	if err != nil {
		return nil, fmt.Errorf("cannot find service account in pod to build in-cluster rest config: %w", err)
	}

	return kubeConfig, nil
}

// getK8sAPIVersion is used to determine which API version the authorization request should use, v1
// for namespaces and v1alpha1 for all other perses related kubernetes resources
func getK8sAPIVersion(scope k8sScope) string {
	switch scope {
	case k8sProjectScope:
		return "v1"
	default:
		return "v1alpha1"
	}
}

// getK8aAPIGroup is used to determine which API group the authorization request should use, empty
// string for namespaces and the perses.dev for all other perses related kubernetes resources
func getK8sAPIGroup(scope k8sScope) string {
	switch scope {
	case k8sProjectScope:
		return ""
	default:
		return "perses.dev"
	}
}

// helper function to convert any type into a user.Info. This function should not error, and it is
// expected that the struct being passed in is user.Info
func getK8sUser(userStruct any) (user.Info, error) {
	if k8sUser, ok := userStruct.(user.Info); ok {
		return k8sUser, nil
	}
	logrus.Errorf("invalid struct type passed to getK8sUser: %s", reflect.TypeOf(userStruct).Name())
	return nil, fmt.Errorf("unable to convert user struct to k8s user interface")
}

// newAuthorizer creates an authorizer compatible with the kubelet's needs
func newAuthorizer(client authorizationclient.AuthorizationV1Interface, conf config.KubernetesProvider) (authorizer.Authorizer, error) {
	if client == nil {
		return nil, errors.New("no client provided, cannot use webhook authorization")
	}
	authorizerConfig := authorizerfactory.DelegatingAuthorizerConfig{
		SubjectAccessReviewClient: client,
		AllowCacheTTL:             time.Duration(conf.AuthorizerAllowTTL),
		DenyCacheTTL:              time.Duration(conf.AuthorizerDenyTTL),
		WebhookRetryBackoff:       options.DefaultAuthWebhookRetryBackoff(),
	}
	return authorizerConfig.New()
}

// newAuthenticator creates an authenticator compatible with the kubelets needs
func newAuthenticator(client authenticationclient.AuthenticationV1Interface, conf config.KubernetesProvider) (authenticator.Request, error) {
	if client == nil {
		return nil, errors.New("tokenaccessreview client not provided, cannot use webhook authentication")
	}

	authenticatorConfig := authenticatorfactory.DelegatingAuthenticatorConfig{
		Anonymous: &apiserver.AnonymousAuthConfig{
			Enabled: false, // always require authentication
		},
		CacheTTL:                time.Duration(conf.AuthenticatorTTL),
		TokenAccessReviewClient: client,
		WebhookRetryBackoff:     options.DefaultAuthWebhookRetryBackoff(),
	}

	authenticator, _, err := authenticatorConfig.New()
	if err != nil {
		return nil, err
	}
	return authenticator, nil
}
