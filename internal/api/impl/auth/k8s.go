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

package auth

import (
	"errors"
	"fmt"
	"net/http"

	"github.com/labstack/echo/v4"
	"github.com/perses/perses/internal/api/authorization"
	"github.com/perses/perses/internal/api/authorization/k8s"

	"github.com/perses/perses/internal/api/route"
	"github.com/perses/perses/internal/api/utils"
	"github.com/sirupsen/logrus"
)

type kubernetesEndpoint struct {
	authz authorization.Authorization
}

func newKubernetesEndpoint(authz authorization.Authorization) route.Endpoint {

	return &kubernetesEndpoint{
		authz: authz,
	}

}

func (e *kubernetesEndpoint) CollectRoutes(g *route.Group) {
	// When authentication is being offloaded to external services then
	// We provide a whoami endpoint for the provider to check user information
	g.GET(fmt.Sprintf("/%s/%s", utils.AuthKindKubernetes, utils.PathWhoami), e.whoami, false)
}

// whoami endpoint allows the frontend and the percli to contact the backend
// with external tokens and receive information about the logged in user
func (e *kubernetesEndpoint) whoami(ctx echo.Context) error {
	user, err := e.authz.GetUser(ctx)
	if err != nil {
		e.logWithError(err)
		return err
	}

	if user == nil {
		err = errors.New("")
		e.logWithError(err)
		return err
	}

	k8sUser, err := k8s.GetK8sUser(user)
	if err != nil {
		e.logWithError(err)
		return err
	}

	username := k8sUser.GetName()
	if len(username) == 0 {
		err = errors.New("empty k8s username found")
		e.logWithError(err)
		return err
	}

	return ctx.JSON(http.StatusOK, &ExternalUserInfoProfile{
		Name: username,
	})
}

// logWithError is a little logrus helper to log with given error
func (e *kubernetesEndpoint) logWithError(err error) {
	logrus.WithError(err).WithField("provider", "kubernetes")
}
