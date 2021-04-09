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

package core

import (
	"github.com/labstack/echo/v4"
	echoUtils "github.com/perses/common/echo"
	"github.com/perses/perses/internal/api/front"
	"github.com/perses/perses/internal/api/impl/v1/project"
	"github.com/perses/perses/internal/api/impl/v1/prometheusrule"
	"github.com/perses/perses/internal/api/impl/v1/user"
	"github.com/perses/perses/internal/api/shared/dependency"
)

type endpoint interface {
	RegisterRoutes(g *echo.Group)
}

type api struct {
	echoUtils.Register
	endpoints     []endpoint
	frontEndpoint endpoint
}

func NewPersesAPI(serviceManager dependency.ServiceManager) echoUtils.Register {
	endpoints := []endpoint{
		project.NewEndpoint(serviceManager.GetProject()),
		prometheusrule.NewEndpoint(serviceManager.GetPrometheusRule()),
		user.NewEndpoint(serviceManager.GetUser()),
	}
	return &api{
		endpoints:     endpoints,
		frontEndpoint: &front.Endpoint{},
	}
}

func (a *api) RegisterRoute(e *echo.Echo) {
	a.frontEndpoint.RegisterRoutes(e.Group(""))
	a.registerAPIV1Route(e)
}

func (a *api) registerAPIV1Route(e *echo.Echo) {
	apiV1 := e.Group("/api/v1")
	for _, ept := range a.endpoints {
		ept.RegisterRoutes(apiV1)
	}
}
