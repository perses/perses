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
	"net/http"

	"github.com/labstack/echo/v4"
	"github.com/perses/perses/internal/api/interface/v1/user"
	"github.com/perses/perses/internal/api/shared"
	"github.com/perses/perses/internal/api/shared/crypto"
	databaseModel "github.com/perses/perses/internal/api/shared/database/model"
	"github.com/perses/perses/pkg/model/api"
	"github.com/sirupsen/logrus"
)

type Endpoint struct {
	dao user.DAO
	jwt crypto.JWT
}

func New(dao user.DAO, jwt crypto.JWT) *Endpoint {
	return &Endpoint{
		dao: dao,
		jwt: jwt,
	}
}

func (e *Endpoint) CollectRoutes(g *shared.Group) {
	g.POST("/auth", e.auth, true)
}

func (e *Endpoint) auth(ctx echo.Context) error {
	body := &api.Auth{}
	if err := ctx.Bind(body); err != nil {
		return shared.HandleBadRequestError(err.Error())
	}
	usr, err := e.dao.Get(body.Login)
	if err != nil {
		if databaseModel.IsKeyNotFound(err) {
			return shared.HandleBadRequestError("wrong login or password ")
		}
	}

	if !crypto.ComparePasswords(usr.Spec.Password, body.Password) {
		return shared.HandleBadRequestError("wrong login or password ")
	}
	token, err := e.jwt.SignedToken(body.Login)
	if err != nil {
		logrus.WithError(err).Errorf("unable to generate the JWT token")
		return shared.InternalError
	}
	return ctx.JSON(http.StatusOK, api.AuthResponse{
		Token: token,
	})
}
