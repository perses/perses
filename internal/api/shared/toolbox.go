// Copyright 2021 The Perses Authors
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

package shared

import (
	"github.com/perses/perses/internal/api/shared/crypto"
	"net/http"

	"github.com/labstack/echo/v4"
	databaseModel "github.com/perses/perses/internal/api/shared/database/model"
	"github.com/perses/perses/pkg/model/api"
)

type Parameters struct {
	Project string
	Name    string
}

func ExtractParameters(ctx echo.Context) Parameters {
	return Parameters{
		Project: GetProjectParameter(ctx),
		Name:    GetNameParameter(ctx),
	}
}

func ExtractJWTClaims(ctx echo.Context, jwtService crypto.JWT) *crypto.JWTCustomClaims {
	claims, err := jwtService.Parse(ctx.Request().Header.Get("Authorization"))
	if err != nil {
		return nil
	}
	return claims
}

type ToolboxService interface {
	Create(entity api.Entity, claims *crypto.JWTCustomClaims) (interface{}, error)
	Update(entity api.Entity, parameters Parameters, claims *crypto.JWTCustomClaims) (interface{}, error)
	Delete(parameters Parameters, claims *crypto.JWTCustomClaims) error
	Get(parameters Parameters, claims *crypto.JWTCustomClaims) (interface{}, error)
	List(q databaseModel.Query, parameters Parameters, claims *crypto.JWTCustomClaims) (interface{}, error)
}

// Toolbox is an interface that defines the different methods that can be used in the different endpoint of the API.
// This is a way to align the code of the different endpoint.
type Toolbox interface {
	Create(ctx echo.Context, entity api.Entity) error
	Update(ctx echo.Context, entity api.Entity) error
	Delete(ctx echo.Context) error
	Get(ctx echo.Context) error
	List(ctx echo.Context, q databaseModel.Query) error
}

func NewToolBox(service ToolboxService, jwtService crypto.JWT) Toolbox {
	return &toolbox{
		service:    service,
		jwtService: jwtService,
	}
}

type toolbox struct {
	Toolbox
	service    ToolboxService
	jwtService crypto.JWT
}

func (t *toolbox) Create(ctx echo.Context, entity api.Entity) error {
	if err := t.bind(ctx, entity); err != nil {
		return err
	}
	claims := ExtractJWTClaims(ctx, t.jwtService)
	newEntity, err := t.service.Create(entity, claims)
	if err != nil {
		return err
	}
	return ctx.JSON(http.StatusOK, newEntity)
}

func (t *toolbox) Update(ctx echo.Context, entity api.Entity) error {
	if err := t.bind(ctx, entity); err != nil {
		return err
	}
	parameters := ExtractParameters(ctx)
	claims := ExtractJWTClaims(ctx, t.jwtService)
	newEntity, err := t.service.Update(entity, parameters, claims)
	if err != nil {
		return err
	}
	return ctx.JSON(http.StatusOK, newEntity)
}

func (t *toolbox) Delete(ctx echo.Context) error {
	parameters := ExtractParameters(ctx)
	claims := ExtractJWTClaims(ctx, t.jwtService)
	if err := t.service.Delete(parameters, claims); err != nil {
		return err
	}
	return ctx.NoContent(http.StatusNoContent)
}

func (t *toolbox) Get(ctx echo.Context) error {
	parameters := ExtractParameters(ctx)
	claims := ExtractJWTClaims(ctx, t.jwtService)
	entity, err := t.service.Get(parameters, claims)
	if err != nil {
		return err
	}
	return ctx.JSON(http.StatusOK, entity)
}

func (t *toolbox) List(ctx echo.Context, q databaseModel.Query) error {
	if err := ctx.Bind(q); err != nil {
		return HandleBadRequestError(err.Error())
	}
	parameters := ExtractParameters(ctx)
	claims := ExtractJWTClaims(ctx, t.jwtService)
	result, err := t.service.List(q, parameters, claims)
	if err != nil {
		return err
	}
	return ctx.JSON(http.StatusOK, result)
}

func (t *toolbox) bind(ctx echo.Context, entity api.Entity) error {
	if err := ctx.Bind(entity); err != nil {
		return HandleBadRequestError(err.Error())
	}
	if err := validateMetadata(ctx, entity.GetMetadata()); err != nil {
		return HandleBadRequestError(err.Error())
	}
	return nil
}
