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

package core

import (
	"github.com/labstack/echo/v4"
	echoUtils "github.com/perses/common/echo"
	"github.com/perses/perses/internal/api/config"
	configendpoint "github.com/perses/perses/internal/api/impl/config"
	"github.com/perses/perses/internal/api/impl/v1/dashboard"
	"github.com/perses/perses/internal/api/impl/v1/datasource"
	"github.com/perses/perses/internal/api/impl/v1/folder"
	"github.com/perses/perses/internal/api/impl/v1/globaldatasource"
	"github.com/perses/perses/internal/api/impl/v1/health"
	"github.com/perses/perses/internal/api/impl/v1/project"
	"github.com/perses/perses/internal/api/shared"
	"github.com/perses/perses/internal/api/shared/dependency"
)

type endpoint interface {
	RegisterRoutes(g *echo.Group)
}

type api struct {
	echoUtils.Register
	apiV1Endpoints []endpoint
	apiEndpoints   []endpoint
}

func NewPersesAPI(serviceManager dependency.ServiceManager, cfg config.Config) echoUtils.Register {
	readonly := cfg.Readonly
	apiV1Endpoints := []endpoint{
		dashboard.NewEndpoint(serviceManager.GetDashboard(), readonly),
		datasource.NewEndpoint(serviceManager.GetDatasource(), readonly),
		folder.NewEndpoint(serviceManager.GetFolder(), readonly),
		globaldatasource.NewEndpoint(serviceManager.GetGlobalDatasource(), readonly),
		health.NewEndpoint(serviceManager.GetHealth()),
		project.NewEndpoint(serviceManager.GetProject(), readonly),
	}
	apiEndpoints := []endpoint{
		configendpoint.New(cfg),
	}
	return &api{
		apiV1Endpoints: apiV1Endpoints,
		apiEndpoints:   apiEndpoints,
	}
}

func (a *api) RegisterRoute(e *echo.Echo) {
	a.registerAPIV1Route(e)
}

func (a *api) registerAPIV1Route(e *echo.Echo) {
	apiGroup := e.Group("/api")
	for _, ept := range a.apiEndpoints {
		ept.RegisterRoutes(apiGroup)
	}
	apiV1Group := e.Group(shared.APIV1Prefix)
	for _, ept := range a.apiV1Endpoints {
		ept.RegisterRoutes(apiV1Group)
	}
}
