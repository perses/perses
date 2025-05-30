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

package auth

import (
	"errors"
	"fmt"
	"net/http"

	"github.com/gorilla/securecookie"
	"github.com/zitadel/oidc/v3/pkg/oidc"
	"golang.org/x/oauth2"

	"github.com/labstack/echo/v4"
	"github.com/perses/perses/internal/api/crypto"
	rbacv1 "github.com/perses/perses/internal/api/rbac"

	"github.com/perses/perses/internal/api/interface/v1/user"
	"github.com/perses/perses/internal/api/route"
	"github.com/perses/perses/internal/api/utils"
	"github.com/perses/perses/pkg/model/api/config"
	v1 "github.com/perses/perses/pkg/model/api/v1"
	"github.com/sirupsen/logrus"

	"k8s.io/client-go/kubernetes"
	"k8s.io/client-go/rest"
)

type kubernetesUserInfo struct {
	externalUserInfoProfile
}

// GetLogin implements [externalUserInfo]
func (u *kubernetesUserInfo) GetLogin() string {
	return u.Name
}

// GetProfile implements [externalUserInfo]
func (u *kubernetesUserInfo) GetProfile() externalUserInfoProfile {
	return u.externalUserInfoProfile
}

// GetProviderContext implements [externalUserInfo]
func (u *kubernetesUserInfo) GetProviderContext() v1.OAuthProvider {
	return v1.OAuthProvider{}
}

type kubernetesEndpoint struct {
	kubernetesAuthenticator *rbacv1.KubernetesAuthenticator
	secureCookie            *securecookie.SecureCookie
	jwt                     crypto.JWT
	tokenManagement         tokenManagement
	svc                     service
	kubeconfig              *rest.Config
}

func newKubernetesEndpoint(provider config.KubernetesProvider, jwt crypto.JWT, dao user.DAO, rbac rbacv1.RBAC) (route.Endpoint, error) {
	// As the cookie is used only at login time, we don't need a persistent value here.
	// (same reason as newOIDCEndpoint)
	key := securecookie.GenerateRandomKey(16)
	secureCookie := securecookie.New(key, key)

	kubeconfig, err := crypto.InitKubeConfig(provider.Kubeconfig)
	if err != nil {
		return nil, fmt.Errorf("failed to load kubeconfig: %w", err)
	}

	kubeClient, err := kubernetes.NewForConfig(kubeconfig)
	if err != nil {
		return nil, fmt.Errorf("failed to instantiate Kubernetes client: %w", err)
	}

	tokenClient := kubeClient.AuthenticationV1()
	kubernetesAuthenticator, err := rbacv1.NewKubernetesAuthenticator(
		tokenClient,
		"",
	)

	if err != nil {
		return nil, err
	}

	return &kubernetesEndpoint{
		kubernetesAuthenticator: kubernetesAuthenticator,
		secureCookie:            secureCookie,
		jwt:                     jwt,
		tokenManagement:         tokenManagement{jwt: jwt},
		svc:                     service{dao: dao, rbac: rbac},
		kubeconfig:              kubeconfig,
	}, nil
}

func (e *kubernetesEndpoint) CollectRoutes(g *route.Group) {
	// Add routes for the "Authorization Code" flow
	g.POST(fmt.Sprintf("/%s/%s", utils.AuthKindKubernetes, utils.PathLogin), e.authn, true)
}

// authn performs user synchronization with the k8s apiserver and generates access and refresh tokens
func (e *kubernetesEndpoint) authn(ctx echo.Context) error {
	req := ctx.Request()

	req.Header.Set("Authorization", crypto.GetAuthnHeaderFromClient(ctx, e.kubeconfig))
	res, ok, err := e.kubernetesAuthenticator.RequestAuthenticator.AuthenticateRequest(req)
	if err != nil {
		e.logWithError(err)
		return err
	}
	if !ok {
		return errors.New("idk")
	}

	user, err := e.svc.syncUser(&kubernetesUserInfo{
		externalUserInfoProfile: externalUserInfoProfile{
			Name: res.User.GetName(),
		},
	})
	if err != nil {
		return err
	}

	setCookie := func(cookie *http.Cookie) {
		http.SetCookie(ctx.Response(), cookie)
	}

	username := user.GetMetadata().GetName()

	accessToken, err := e.tokenManagement.accessToken(username, setCookie)
	if err != nil {
		e.logWithError(err).Error("Failed to generate and save access token.")
		return err
	}
	refreshToken, err := e.tokenManagement.refreshToken(username, setCookie)
	if err != nil {
		e.logWithError(err).Error("Failed to generate and save refresh token.")
		return err
	}

	return ctx.JSON(http.StatusOK, &oauth2.Token{
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
		TokenType:    oidc.BearerToken,
	})
}

// logWithError is a little logrus helper to log with given error
func (e *kubernetesEndpoint) logWithError(err error) *logrus.Entry {
	return logrus.WithError(err).WithField("provider", "kubernetes")
}
