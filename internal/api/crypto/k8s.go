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

package crypto

import (
	"errors"
	"fmt"
	"time"

	"github.com/labstack/echo/v4"
	"github.com/perses/perses/pkg/model/api/config"
	"k8s.io/apiserver/pkg/apis/apiserver"
	"k8s.io/apiserver/pkg/authentication/authenticator"
	"k8s.io/apiserver/pkg/authentication/authenticatorfactory"
	"k8s.io/apiserver/pkg/authorization/authorizer"

	k8suser "k8s.io/apiserver/pkg/authentication/user"
	authenticationclient "k8s.io/client-go/kubernetes/typed/authentication/v1"
	authorizationclient "k8s.io/client-go/kubernetes/typed/authorization/v1"

	"k8s.io/apiserver/pkg/authorization/authorizerfactory"
	"k8s.io/apiserver/pkg/server/options"
	"k8s.io/client-go/kubernetes"
	"k8s.io/client-go/rest"
	"k8s.io/client-go/tools/clientcmd"
)

// GetProfile implements [Security]
type K8sSecurity struct {
	jwt           JWT
	Authenticator authenticator.Request
	Authorizer    authorizer.Authorizer
	Kubeconfig    *rest.Config
}

// GetUser implements [Security]
func (auth *K8sSecurity) GetUser(ctx echo.Context) string {
	req := ctx.Request().Clone(ctx.Request().Context())

	req.Header.Set("Authorization", GetAuthnHeaderFromClient(ctx, auth.Kubeconfig))
	res, ok, err := auth.Authenticator.AuthenticateRequest(req)
	if err != nil || !ok {
		return ""
	}

	return res.User.GetName()
}

// GetJWT implements [Security]
func (auth *K8sSecurity) GetJWT() JWT {
	return auth.jwt
}

// GetUser implements [Security]
func (auth *K8sSecurity) GetK8sUser(ctx echo.Context) (k8suser.Info, error) {
	req := ctx.Request().Clone(ctx.Request().Context())

	req.Header.Set("Authorization", GetAuthnHeaderFromClient(ctx, auth.Kubeconfig))
	res, ok, err := auth.Authenticator.AuthenticateRequest(req)
	if err != nil {
		return nil, err
	}
	if !ok {
		return nil, errors.New("invalid authorization request format")
	}

	return res.User, nil
}

func GetKubernetesAuth(security config.Security, jwt JwtImpl) *K8sSecurity {
	if !security.Authentication.Providers.KubernetesProvider.Enabled {
		return nil
	}
	kubeconfig, err := InitKubeConfig(security.Authentication.Providers.KubernetesProvider.Kubeconfig)
	if err != nil {
		return nil
	}

	// Since the Authenticator will need to make a lot of requests to check all permissions, raise the
	// default limits
	kubeconfig.QPS = 500
	kubeconfig.Burst = 1000

	kubeClient, err := kubernetes.NewForConfig(kubeconfig)
	if err != nil {
		return nil
	}

	sarClient := kubeClient.AuthorizationV1()
	authorizer, err := newAuthorizer(sarClient)
	if err != nil {
		return nil
	}

	tokenClient := kubeClient.AuthenticationV1()
	kubernetesAuthenticator, err := newAuthenticator(
		tokenClient,
	)
	if err != nil {
		return nil
	}
	return &K8sSecurity{
		Authenticator: kubernetesAuthenticator,
		Authorizer:    authorizer,
		Kubeconfig:    kubeconfig,
		jwt:           jwt.GetJWT(),
	}
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

// NewSarAuthorizer creates an authorizer compatible with the kubelet's needs
func newAuthorizer(client authorizationclient.AuthorizationV1Interface) (authorizer.Authorizer, error) {
	if client == nil {
		return nil, errors.New("no client provided, cannot use webhook authorization")
	}
	authorizerConfig := authorizerfactory.DelegatingAuthorizerConfig{
		SubjectAccessReviewClient: client,
		AllowCacheTTL:             5 * time.Minute,
		DenyCacheTTL:              30 * time.Second,
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
		CacheTTL:                2 * time.Minute,
		TokenAccessReviewClient: client,
		WebhookRetryBackoff:     options.DefaultAuthWebhookRetryBackoff(),
	}

	authenticator, _, err := authenticatorConfig.New()
	if err != nil {
		return nil, err
	}
	return authenticator, nil
}
