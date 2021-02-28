// Copyright 2021 Amadeus s.a.s
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
)

type Parameters struct {
	Name string
}

func extractParameters(ctx echo.Context) Parameters {
	return Parameters{
		Name: getNameParameter(ctx),
	}
}

type ToolboxService interface {
	Create(entity interface{}) (interface{}, error)
	Update(entity interface{}, parameters Parameters) (interface{}, error)
	Delete(parameters Parameters) error
	Get(parameters Parameters) (interface{}, error)
}

// Toolbox is an interface that defines the different methods that can be used in the different endpoint of the API.
// This is a way to align the code of the different endpoint.
type Toolbox interface {
	Create(ctx echo.Context, entity interface{}) error
	Update(ctx echo.Context, entity interface{}) error
	Delete(ctx echo.Context) error
	Get(ctx echo.Context) error
}

func NewToolBox(service ToolboxService) Toolbox {
	return &toolboxImpl{
		service: service,
	}
}

type toolboxImpl struct {
	Toolbox
	service ToolboxService
}

func (t *toolboxImpl) Create(ctx echo.Context, entity interface{}) error {
	if err := ctx.Bind(entity); err != nil {
		return err
	}
	newEntity, err := t.service.Create(entity)
	if err != nil {
		return handleError(err)
	}
	return ctx.JSON(http.StatusOK, newEntity)
}

func (t *toolboxImpl) Update(ctx echo.Context, entity interface{}) error {
	if err := ctx.Bind(entity); err != nil {
		return err
	}
	parameters := extractParameters(ctx)
	newEntity, err := t.service.Update(entity, parameters)
	if err != nil {
		return handleError(err)
	}
	return ctx.JSON(http.StatusOK, newEntity)
}

func (t *toolboxImpl) Delete(ctx echo.Context) error {
	parameters := extractParameters(ctx)
	if err := t.service.Delete(parameters); err != nil {
		return handleError(err)
	}
	return ctx.NoContent(http.StatusNoContent)
}

func (t *toolboxImpl) Get(ctx echo.Context) error {
	parameters := extractParameters(ctx)
	entity, err := t.service.Get(parameters)
	if err != nil {
		return handleError(err)
	}
	return ctx.JSON(http.StatusOK, entity)
}
