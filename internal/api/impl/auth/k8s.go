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
	"fmt"
	"net/http"

	"github.com/zitadel/oidc/v3/pkg/oidc"
	"golang.org/x/oauth2"

	"github.com/labstack/echo/v4"
	"github.com/perses/perses/internal/api/crypto"
	rbacv1 "github.com/perses/perses/internal/api/rbac"

	"github.com/perses/perses/internal/api/interface/v1/user"
	"github.com/perses/perses/internal/api/route"
	"github.com/perses/perses/internal/api/utils"
	v1 "github.com/perses/perses/pkg/model/api/v1"
	"github.com/sirupsen/logrus"
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
	security        crypto.K8sSecurity
	tokenManagement tokenManagement
	svc             service
}

func newKubernetesEndpoint(security crypto.Security, dao user.DAO, rbac rbacv1.RBAC) (route.Endpoint, error) {
	k8sSecurity, ok := security.(*crypto.K8sSecurity)
	if !ok {
		return nil, fmt.Errorf("invalid security config")
	}

	return &kubernetesEndpoint{
		security:        *k8sSecurity,
		tokenManagement: tokenManagement{jwt: k8sSecurity.GetJWT()},
		svc:             service{dao: dao, rbac: rbac},
	}, nil
}

func (e *kubernetesEndpoint) CollectRoutes(g *route.Group) {
	// Add routes for the "Authorization Code" flow
	g.POST(fmt.Sprintf("/%s/%s", utils.AuthKindKubernetes, utils.PathLogin), e.loginAndSync, true)
}

// loginAndSync performs user synchronization with the k8s apiserver and generates access and refresh tokens
func (e *kubernetesEndpoint) loginAndSync(ctx echo.Context) error {
	k8sUser, err := e.security.GetK8sUser(ctx)
	if err != nil {
		return err
	}

	user, err := e.svc.syncUser(&kubernetesUserInfo{
		externalUserInfoProfile: externalUserInfoProfile{
			Name: k8sUser.GetName(),
		},
	})
	if err != nil {
		return err
	}

	setCookie := func(cookie *http.Cookie) {
		http.SetCookie(ctx.Response(), cookie)
	}

	username := user.GetMetadata().GetName()

	// Set cookie for the frontend to use to determine username that shows up. Cookie and JWT
	// have no purpose for the k8s mode other than a consistent way to tell the frontend which user
	// is logged in
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
