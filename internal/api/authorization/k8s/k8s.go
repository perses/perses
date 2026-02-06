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
	"context"
	"errors"
	"fmt"
	"slices"
	"time"

	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
	"github.com/perses/perses/internal/api/crypto"
	apiInterface "github.com/perses/perses/internal/api/interface"
	"github.com/perses/perses/internal/api/utils"
	clientConfig "github.com/perses/perses/pkg/client/config"
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
)

func New(conf config.Config) (*k8sImpl, error) {
	if !conf.Security.Authorization.Provider.Kubernetes.Enable {
		return nil, fmt.Errorf("kubernetes authorization is not enabled")
	}
	kubeconfig, err := clientConfig.InitKubeConfig(conf.Security.Authorization.Provider.Kubernetes.Kubeconfig)
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
	k8sAuthorizer, err := newAuthorizer(sarClient, conf.Security.Authorization.Provider.Kubernetes)
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
		authorizer:    k8sAuthorizer,
		kubeClient:    kubeClient,
	}, nil
}

type k8sImpl struct {
	authenticator authenticator.Request
	authorizer    authorizer.Authorizer
	kubeClient    kubernetes.Interface
}

// IsEnabled implements [Authorization]
func (k *k8sImpl) IsEnabled() bool {
	return true
}

// IsNativeAuthz implements [Authorization]
func (k *k8sImpl) IsNativeAuthz() bool {
	return false
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

	// Since we know that kubernetes expects the authorization header, we should check and return a
	// specific error if it doesn't exist
	if len(ctx.Request().Header.Get("Authorization")) == 0 {
		return nil, errors.New("missing authorization header")
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

// GetPublicUser implements [Authorization]
func (k *k8sImpl) GetPublicUser(ctx echo.Context) (*v1.PublicUser, error) {
	username, err := k.GetUsername(ctx)
	if err != nil {
		return nil, err
	}

	return &v1.PublicUser{
		Kind:     v1.KindUser,
		Metadata: v1.NewPublicMetadata(username),
		Spec:     v1.PublicUserSpec{},
	}, nil
}

// GetProviderInfo implements [Authorization]
func (k *k8sImpl) GetProviderInfo(_ echo.Context) (crypto.ProviderInfo, error) {
	// Provider Info is essentially used to know the original type of authentication provider used when using native authorization model.
	// For k8s authorization, the authentication is not using provider but k8s, so there won't be any provider info to retrieve.
	return crypto.ProviderInfo{}, nil
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
				logrus.Error(err.Error())
				return apiInterface.HandleUnauthorizedError("invalid authorization header")
			}

			return next(ctx)
		}
	}
}

// GetUserProjects implements [Authorization]
func (k *k8sImpl) GetUserProjects(ctx echo.Context, _ v1Role.Action, _ v1Role.Scope) ([]string, error) {
	if utils.IsAnonymous(ctx) {
		// This method should not be called if the endpoint is anonymous or the username is not found.
		logrus.Error("failed to get username from context to list the user projects")
		return nil, apiInterface.InternalError
	}

	usr, err := k.GetUser(ctx)
	if err != nil {
		return nil, err
	}

	kubernetesUser, err := getK8sUser(usr)
	if err != nil {
		return nil, err
	}

	k8sNamespaces := k.getNamespaceList()
	authorizedNamespaces := []string{}
	for _, k8sNamespace := range k8sNamespaces {
		if k.hasPermissionForNamespace(ctx, k8sNamespace, kubernetesUser) {
			authorizedNamespaces = append(authorizedNamespaces, k8sNamespace)
		}
	}

	return authorizedNamespaces, nil
}

// HasPermission implements [Authorization]
func (k *k8sImpl) HasPermission(ctx echo.Context, requestAction v1Role.Action, requestProject string, requestScope v1Role.Scope) bool {
	// If the context is nil, it means the function is called internally without a request context.
	// And in this case, we assume we want to bypass the authorization check.
	if ctx == nil {
		return true
	}
	if utils.IsAnonymous(ctx) {
		// If the endpoint is anonymous, we allow the request to pass through.
		return true
	}

	usr, err := k.GetUser(ctx)
	if err != nil {
		return false
	}

	kubernetesUser, err := getK8sUser(usr)
	if err != nil {
		return false
	}

	scope := getK8sScope(requestScope)
	if scope == "" {
		// The permission isn't k8s related, default to false for now
		return false
	}

	authorized, _ := k.checkSpecificPermision(ctx, requestProject, kubernetesUser, requestScope, requestAction)

	return authorized == authorizer.DecisionAllow
}

// GetPermissions implements [Authorization]
func (k *k8sImpl) GetPermissions(ctx echo.Context) (map[string][]*v1Role.Permission, error) {
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
	usr, err := k.GetUser(ctx)
	if err != nil {
		return nil, err
	}
	if usr == nil {
		// The user is unable to be found for the request, however without a user we cannot determine
		// their permissions
		return nil, apiInterface.InternalError
	}

	kubernetesUser, err := getK8sUser(usr)
	if err != nil {
		return nil, err
	}

	userPermissions := make(map[string][]*v1Role.Permission)

	namespaces := k.getNamespaceList()

	// Do an initial pass over the all namespace project so that we don't have to check the permissions available there
	// against any of the projects we check after this point
	allNamespacePermittedActions := map[v1Role.Scope][]v1Role.Action{}
	allNamespacePermissions := []*v1Role.Permission{}
	for _, scope := range globalScopesToCheck {
		permittedActions := k.getPermittedActions(ctx, v1.WildcardProject, kubernetesUser, scope, []v1Role.Action{})
		if len(permittedActions) > 0 {
			allNamespacePermittedActions[scope] = permittedActions
			allNamespacePermissions = append(allNamespacePermissions, &v1Role.Permission{
				Scopes:  []v1Role.Scope{scope},
				Actions: permittedActions,
			})
		}
	}
	if len(allNamespacePermissions) > 0 {
		userPermissions[v1.WildcardProject] = allNamespacePermissions
	}

	for _, namespace := range namespaces {
		namespacePermissions := k.getNamespacePermissions(ctx, namespace, kubernetesUser, projectScopesToCheck, allNamespacePermittedActions)
		if len(namespacePermissions) > 0 {
			userPermissions[namespace] = namespacePermissions
		}
	}

	return userPermissions, nil
}

func (k *k8sImpl) getNamespacePermissions(ctx echo.Context, namespace string, user user.Info, scopes []v1Role.Scope, knownPermissions map[v1Role.Scope][]v1Role.Action) []*v1Role.Permission {
	namespacePermissions := []*v1Role.Permission{}
	for _, scope := range scopes {
		permittedActions := k.getPermittedActions(ctx, namespace, user, scope, knownPermissions[scope])
		if len(permittedActions) > 0 {
			namespacePermissions = append(namespacePermissions, &v1Role.Permission{
				Scopes:  []v1Role.Scope{scope},
				Actions: permittedActions,
			})
		}
	}
	return namespacePermissions
}

func (k *k8sImpl) getPermittedActions(ctx echo.Context, namespace string, user user.Info, scope v1Role.Scope, knownActions []v1Role.Action) []v1Role.Action {
	// We only need to check actions which aren't already permitted
	actionsToCheck := getUnknownActions(knownActions)
	newlyValidActions := []v1Role.Action{}
	for _, action := range actionsToCheck {
		authorized, err := k.checkSpecificPermision(ctx, namespace, user, scope, action)

		if err != nil {
			// If the request errors, then assume the rest of the requests will also error and break
			// out early
			return newlyValidActions
		}

		if action == v1Role.WildcardAction && authorized == authorizer.DecisionAllow {
			newlyValidActions = append(newlyValidActions, v1Role.WildcardAction)
			return newlyValidActions
		}

		if action == v1Role.ReadAction && authorized == authorizer.DecisionDeny {
			// If the user cannot even read the scope then assume they won't have other access
			return newlyValidActions
		}

		if authorized == authorizer.DecisionAllow {
			newlyValidActions = append(newlyValidActions, action)
		}
	}
	return newlyValidActions
}

func getUnknownActions(knownActions []v1Role.Action) []v1Role.Action {
	// If all actions are permitted in then nothing is unknown
	if len(knownActions) == 1 && knownActions[0] == v1Role.WildcardAction {
		return []v1Role.Action{}
	}
	allActions := []v1Role.Action{
		v1Role.WildcardAction,
		v1Role.ReadAction,
		v1Role.CreateAction,
		v1Role.UpdateAction,
		v1Role.DeleteAction,
	}
	return slices.DeleteFunc(allActions, func(actionToCheck v1Role.Action) bool {
		return slices.Contains(knownActions, actionToCheck)
	})
}

func (k *k8sImpl) checkSpecificPermision(ctx echo.Context, namespace string, user user.Info, scope v1Role.Scope, action v1Role.Action) (authorized authorizer.Decision, err error) {
	k8sScope := getK8sScope(scope)
	apiGroup := getK8sAPIGroup(k8sScope)
	apiVersion := getK8sAPIVersion(k8sScope)

	// To align with Perses RBAC any Global resource is not namespaced
	if slices.Contains(globalScopes, scope) {
		namespace = v1.WildcardProject
	}

	attributes := authorizer.AttributesRecord{
		User:            user,
		Verb:            string(getK8sAction(action)),
		Namespace:       namespace,
		APIGroup:        apiGroup,
		APIVersion:      apiVersion,
		Resource:        string(k8sScope),
		Subresource:     "",
		Name:            "",
		ResourceRequest: true,
	}
	authorized, _, err = k.authorizer.Authorize(ctx.Request().Context(), attributes)
	return authorized, err
}

// RefreshPermissions implements [Authorization]
func (k *k8sImpl) RefreshPermissions() error {
	return nil
}

func (k *k8sImpl) hasPermissionForNamespace(ctx echo.Context, namespace string, user user.Info) bool {
	// Rather than checking if the user has access to the namespace, we check if the user has access
	// to read any of the perses scopes within the namespace, since namespaces which the user has access to
	// but cannot view perses scopes are irrelevant
	for _, scope := range projectScopesToCheck {
		authorized, _ := k.checkSpecificPermision(ctx, namespace, user, scope, v1Role.ReadAction)
		if authorized == authorizer.DecisionAllow {
			// We can return early if the user can access any of the scopes
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
	logrus.Errorf("invalid struct type passed representing the user in kubernetes provider: %T", userStruct)
	return nil, fmt.Errorf("unable to convert user struct to k8s user interface")
}

// newAuthorizer creates an authorizer compatible with the kubelet's needs
func newAuthorizer(client authorizationclient.AuthorizationV1Interface, conf config.KubernetesAuthorizationProvider) (authorizer.Authorizer, error) {
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
func newAuthenticator(client authenticationclient.AuthenticationV1Interface, conf config.KubernetesAuthorizationProvider) (authenticator.Request, error) {
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

	result, _, err := authenticatorConfig.New()
	// In case of error, the function New() will return nil, nil, err.
	// So, we don't need to check if the error is nil or not.
	return result, err
}
