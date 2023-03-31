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
	"net/http"

	"github.com/labstack/echo/v4"
	databaseModel "github.com/perses/perses/internal/api/shared/database/model"
	"github.com/perses/perses/pkg/model/api"
)

type Parameters struct {
	Project string
	Name    string
}

func extractParameters(ctx echo.Context) Parameters {
	return Parameters{
		Project: GetProjectParameter(ctx),
		Name:    getNameParameter(ctx),
	}
}

type ToolboxService interface {
	Create(entity api.Entity) (interface{}, error)
	Update(entity api.Entity, parameters Parameters) (interface{}, error)
	Delete(parameters Parameters) error
	Get(parameters Parameters) (interface{}, error)
	List(q databaseModel.Query, parameters Parameters) (interface{}, error)
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

func NewToolBox(service ToolboxService) Toolbox {
	return &toolbox{
		service: service,
	}
}

type toolbox struct {
	Toolbox
	service ToolboxService
}

func (t *toolbox) Create(ctx echo.Context, entity api.Entity) error {
	if err := t.bind(ctx, entity); err != nil {
		return err
	}
	newEntity, err := t.service.Create(entity)
	if err != nil {
		return err
	}
	return ctx.JSON(http.StatusOK, newEntity)
}

func (t *toolbox) Update(ctx echo.Context, entity api.Entity) error {
	if err := t.bind(ctx, entity); err != nil {
		return err
	}
	parameters := extractParameters(ctx)
	newEntity, err := t.service.Update(entity, parameters)
	if err != nil {
		return err
	}
	return ctx.JSON(http.StatusOK, newEntity)
}

func (t *toolbox) Delete(ctx echo.Context) error {
	parameters := extractParameters(ctx)
	if err := t.service.Delete(parameters); err != nil {
		return err
	}
	return ctx.NoContent(http.StatusNoContent)
}

func (t *toolbox) Get(ctx echo.Context) error {
	parameters := extractParameters(ctx)
	entity, err := t.service.Get(parameters)
	if err != nil {
		return err
	}
	return ctx.JSON(http.StatusOK, entity)
}

func (t *toolbox) List(ctx echo.Context, q databaseModel.Query) error {
	if err := ctx.Bind(q); err != nil {
		return HandleBadRequestError(err.Error())
	}
	parameters := extractParameters(ctx)
	result, err := t.service.List(q, parameters)
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
