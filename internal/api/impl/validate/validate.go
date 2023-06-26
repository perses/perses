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

package validate

import (
	"fmt"
	"net/http"

	"github.com/labstack/echo/v4"
	"github.com/perses/perses/internal/api/shared"
	"github.com/perses/perses/internal/api/shared/schemas"
	"github.com/perses/perses/internal/api/shared/validate"
	v1 "github.com/perses/perses/pkg/model/api/v1"
)

type Endpoint struct {
	sch schemas.Schemas
}

func New(sch schemas.Schemas) *Endpoint {
	return &Endpoint{sch: sch}
}

func (e *Endpoint) RegisterRoutes(g *echo.Group) {
	path := "/validate"
	g.POST(fmt.Sprintf("%s/%s", path, shared.PathDashboard), e.ValidateDashboard)
	g.POST(fmt.Sprintf("%s/%s", path, shared.PathDatasource), e.ValidateDatasource)
	g.POST(fmt.Sprintf("%s/%s", path, shared.PathGlobalDatasource), e.ValidateGlobalDatasource)
	g.POST(fmt.Sprintf("%s/%s", path, shared.PathVariable), e.ValidateVariable)
	g.POST(fmt.Sprintf("%s/%s", path, shared.PathGlobalVariable), e.ValidateGlobalVariable)
}

func (e *Endpoint) ValidateDashboard(ctx echo.Context) error {
	entity := &v1.Dashboard{}
	if err := ctx.Bind(entity); err != nil {
		return shared.HandleBadRequestError(err.Error())
	}
	if err := validate.Dashboard(entity, e.sch); err != nil {
		return shared.HandleBadRequestError(err.Error())
	}
	return ctx.NoContent(http.StatusOK)
}

func (e *Endpoint) ValidateDatasource(ctx echo.Context) error {
	return validateDatasource(&v1.Datasource{}, e.sch, ctx)
}

func (e *Endpoint) ValidateGlobalDatasource(ctx echo.Context) error {
	return validateDatasource(&v1.GlobalDatasource{}, e.sch, ctx)
}

func (e *Endpoint) ValidateVariable(ctx echo.Context) error {
	entity := &v1.Variable{}
	if err := ctx.Bind(entity); err != nil {
		return shared.HandleBadRequestError(err.Error())
	}
	if err := e.sch.ValidateGlobalVariable(entity.Spec); err != nil {
		return shared.HandleBadRequestError(err.Error())
	}
	return ctx.NoContent(http.StatusOK)
}

func (e *Endpoint) ValidateGlobalVariable(ctx echo.Context) error {
	entity := &v1.GlobalVariable{}
	if err := ctx.Bind(entity); err != nil {
		return shared.HandleBadRequestError(err.Error())
	}
	if err := e.sch.ValidateGlobalVariable(entity.Spec); err != nil {
		return shared.HandleBadRequestError(err.Error())
	}
	return ctx.NoContent(http.StatusOK)
}

func validateDatasource[T v1.DatasourceInterface](entity T, sch schemas.Schemas, ctx echo.Context) error {
	if err := ctx.Bind(entity); err != nil {
		return shared.HandleBadRequestError(err.Error())
	}
	if err := validate.Datasource(entity, nil, sch); err != nil {
		return shared.HandleBadRequestError(err.Error())
	}
	return ctx.NoContent(http.StatusOK)
}
