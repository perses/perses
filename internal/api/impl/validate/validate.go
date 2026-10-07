// Copyright The Perses Authors
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
	"github.com/perses/perses/internal/api/interface"
	"github.com/perses/perses/internal/api/interface/v1/dashboard"
	"github.com/perses/perses/internal/api/netguard"
	"github.com/perses/perses/internal/api/plugin/schema"
	"github.com/perses/perses/internal/api/route"
	"github.com/perses/perses/internal/api/utils"
	"github.com/perses/perses/internal/api/validate"
	"github.com/perses/perses/pkg/model/api/config"
	v1 "github.com/perses/perses/pkg/model/api/v1"
)

type endpoint struct {
	sch       schema.Schema
	dashboard dashboard.Service
	// proxyCfg is used to validate the proxy of the datasources (e.g. its timeout) against the server configuration.
	proxyCfg config.HTTPProxyConfig
	// guard verifies the destination of the proxy of the datasources, like when they are saved. It must not be nil.
	guard *netguard.Guard
}

func New(cfg config.DatasourceConfig, sch schema.Schema, dashboard dashboard.Service, guard *netguard.Guard) route.Endpoint {
	return &endpoint{
		sch:       sch,
		dashboard: dashboard,
		proxyCfg:  cfg.Proxy.HTTP,
		guard:     guard,
	}
}

func (e *endpoint) CollectRoutes(g *route.Group) {
	group := g.Group("/validate")
	group.POST(fmt.Sprintf("/%s", utils.PathDashboard), e.ValidateDashboard, true)
	group.POST(fmt.Sprintf("/%s", utils.PathDatasource), e.ValidateDatasource, true)
	group.POST(fmt.Sprintf("/%s", utils.PathGlobalDatasource), e.ValidateGlobalDatasource, true)
	group.POST(fmt.Sprintf("/%s", utils.PathVariable), e.ValidateVariable, true)
	group.POST(fmt.Sprintf("/%s", utils.PathGlobalVariable), e.ValidateGlobalVariable, true)
}

func (e *endpoint) ValidateDashboard(ctx echo.Context) error {
	entity := &v1.Dashboard{}
	if err := ctx.Bind(entity); err != nil {
		return apiinterface.HandleBadRequestError(err.Error())
	}

	if err := e.dashboard.Validate(entity); err != nil {
		return apiinterface.HandleBadRequestError(err.Error())
	}

	return ctx.NoContent(http.StatusOK)
}

func (e *endpoint) ValidateDatasource(ctx echo.Context) error {
	return e.validateDatasource(&v1.Datasource{}, ctx)
}

func (e *endpoint) ValidateGlobalDatasource(ctx echo.Context) error {
	return e.validateDatasource(&v1.GlobalDatasource{}, ctx)
}

func (e *endpoint) ValidateVariable(ctx echo.Context) error {
	return validateVariable(&v1.Variable{}, e.sch, ctx)
}

func (e *endpoint) ValidateGlobalVariable(ctx echo.Context) error {
	return validateVariable(&v1.GlobalVariable{}, e.sch, ctx)
}

func (e *endpoint) validateDatasource(entity v1.DatasourceInterface, ctx echo.Context) error {
	if err := ctx.Bind(entity); err != nil {
		return apiinterface.HandleBadRequestError(err.Error())
	}
	if err := validate.Datasource(entity, nil, e.sch, &e.proxyCfg); err != nil {
		return apiinterface.HandleBadRequestError(err.Error())
	}
	// Same verification as when the datasource is saved, so a datasource reported as valid is not refused on save.
	if err := e.guard.ValidateDatasourceSpec(entity.GetDatasourceSpec()); err != nil {
		return apiinterface.HandleBadRequestError(err.Error())
	}
	return ctx.NoContent(http.StatusOK)
}

func validateVariable(entity v1.VariableInterface, sch schema.Schema, ctx echo.Context) error {
	if err := ctx.Bind(entity); err != nil {
		return apiinterface.HandleBadRequestError(err.Error())
	}
	if err := validate.Variable(entity, sch); err != nil {
		return apiinterface.HandleBadRequestError(err.Error())
	}
	return ctx.NoContent(http.StatusOK)
}
