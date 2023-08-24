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
	"github.com/perses/perses/internal/api/interface/v1/dashboard"
	"github.com/perses/perses/internal/api/shared"
	"github.com/perses/perses/internal/api/shared/schemas"
	"github.com/perses/perses/internal/api/shared/validate"
	v1 "github.com/perses/perses/pkg/model/api/v1"
)

type Endpoint struct {
	sch       schemas.Schemas
	dashboard dashboard.Service
}

func New(sch schemas.Schemas, dashboard dashboard.Service) *Endpoint {
	return &Endpoint{
		sch:       sch,
		dashboard: dashboard,
	}
}

func (e *Endpoint) RegisterRoutes(g *echo.Group) {
	group := g.Group("/validate")
	group.POST(fmt.Sprintf("/%s", shared.PathDashboard), e.ValidateDashboard)
	group.POST(fmt.Sprintf("/%s", shared.PathDatasource), e.ValidateDatasource)
	group.POST(fmt.Sprintf("/%s", shared.PathGlobalDatasource), e.ValidateGlobalDatasource)
	group.POST(fmt.Sprintf("/%s", shared.PathVariable), e.ValidateVariable)
	group.POST(fmt.Sprintf("/%s", shared.PathGlobalVariable), e.ValidateGlobalVariable)
}

func (e *Endpoint) ValidateDashboard(ctx echo.Context) error {
	entity := &v1.Dashboard{}
	if err := ctx.Bind(entity); err != nil {
		return shared.HandleBadRequestError(err.Error())
	}

	if err := e.dashboard.Validate(entity); err != nil {
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
	return validateVariable(&v1.Variable{}, e.sch, ctx)
}

func (e *Endpoint) ValidateGlobalVariable(ctx echo.Context) error {
	return validateVariable(&v1.GlobalVariable{}, e.sch, ctx)
}

func validateDatasource(entity v1.DatasourceInterface, sch schemas.Schemas, ctx echo.Context) error {
	if err := ctx.Bind(entity); err != nil {
		return shared.HandleBadRequestError(err.Error())
	}
	if err := validate.Datasource(entity, nil, sch); err != nil {
		return shared.HandleBadRequestError(err.Error())
	}
	return ctx.NoContent(http.StatusOK)
}

func validateVariable(entity v1.VariableInterface, sch schemas.Schemas, ctx echo.Context) error {
	if err := ctx.Bind(entity); err != nil {
		return shared.HandleBadRequestError(err.Error())
	}
	if err := validate.Variable(entity, sch); err != nil {
		return shared.HandleBadRequestError(err.Error())
	}
	return ctx.NoContent(http.StatusOK)
}
