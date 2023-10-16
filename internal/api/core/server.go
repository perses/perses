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
	authendpoint "github.com/perses/perses/internal/api/impl/auth"
	configendpoint "github.com/perses/perses/internal/api/impl/config"
	migrateendpoint "github.com/perses/perses/internal/api/impl/migrate"
	"github.com/perses/perses/internal/api/impl/v1/dashboard"
	"github.com/perses/perses/internal/api/impl/v1/datasource"
	"github.com/perses/perses/internal/api/impl/v1/folder"
	"github.com/perses/perses/internal/api/impl/v1/globaldatasource"
	"github.com/perses/perses/internal/api/impl/v1/globalsecret"
	"github.com/perses/perses/internal/api/impl/v1/globalvariable"
	"github.com/perses/perses/internal/api/impl/v1/health"
	"github.com/perses/perses/internal/api/impl/v1/project"
	"github.com/perses/perses/internal/api/impl/v1/secret"
	"github.com/perses/perses/internal/api/impl/v1/user"
	"github.com/perses/perses/internal/api/impl/v1/variable"
	validateendpoint "github.com/perses/perses/internal/api/impl/validate"
	"github.com/perses/perses/internal/api/shared"
	"github.com/perses/perses/internal/api/shared/dependency"
)

type endpoint interface {
	CollectRoutes(g *shared.Group)
}

type api struct {
	echoUtils.Register
	apiV1Endpoints []endpoint
	apiEndpoints   []endpoint
	jwtMiddleware  echo.MiddlewareFunc
}

func NewPersesAPI(serviceManager dependency.ServiceManager, persistenceManager dependency.PersistenceManager, cfg config.Config) echoUtils.Register {
	readonly := cfg.Readonly
	apiV1Endpoints := []endpoint{
		dashboard.NewEndpoint(serviceManager.GetDashboard(), readonly),
		datasource.NewEndpoint(serviceManager.GetDatasource(), readonly),
		folder.NewEndpoint(serviceManager.GetFolder(), readonly),
		globaldatasource.NewEndpoint(serviceManager.GetGlobalDatasource(), readonly),
		globalsecret.NewEndpoint(serviceManager.GetGlobalSecret(), readonly),
		globalvariable.NewEndpoint(serviceManager.GetGlobalVariable(), readonly),
		health.NewEndpoint(serviceManager.GetHealth()),
		project.NewEndpoint(serviceManager.GetProject(), readonly),
		secret.NewEndpoint(serviceManager.GetSecret(), readonly),
		user.NewEndpoint(serviceManager.GetUser(), readonly),
		variable.NewEndpoint(serviceManager.GetVariable(), readonly),
	}
	apiEndpoints := []endpoint{
		configendpoint.New(cfg),
		migrateendpoint.New(serviceManager.GetMigration()),
		validateendpoint.New(serviceManager.GetSchemas(), serviceManager.GetDashboard()),
		authendpoint.New(persistenceManager.GetUser(), serviceManager.GetJWT()),
	}
	return &api{
		apiV1Endpoints: apiV1Endpoints,
		apiEndpoints:   apiEndpoints,
		jwtMiddleware: serviceManager.GetJWT().Middleware(func(c echo.Context) bool {
			return !*cfg.ActivatePermission
		}),
	}
}

func (a *api) RegisterRoute(e *echo.Echo) {
	// First, let's collect every route.
	// The expecting result is a tree we will need to loop over.
	groups := a.collectRoutes()
	// Now let's create a simple struct that will help us to loop over the route tree.
	type queueElement struct {
		parent *echo.Group
		group  *shared.Group
	}
	var queue []queueElement
	for _, g := range groups {
		queue = append(queue, queueElement{group: g})
	}
	// It is our current element on each iteration.
	var el queueElement
	for len(queue) > 0 {
		// Let's grab the first element of the queue and remove it so the size of the queue is decreasing.
		el, queue = queue[0], queue[1:]
		// Now we need to initialize the echo group that will be used to finally register in the router the different route.
		var group *echo.Group
		if el.parent != nil {
			// The group can be created in a chain.
			// That's why if there is a group parent, we need to use it to create the new current group
			group = el.parent.Group(el.group.Path)
		} else {
			group = e.Group(el.group.Path)
		}
		// Then let's collect every child group, so we can loop over them during a future iteration.
		for _, g := range el.group.Groups {
			queue = append(queue, queueElement{group: g, parent: group})
		}
		// Finally, register the route with the echo.Group previously created.
		// We will consider also if the route needs to remain anonymous or not and then inject the JWT middleware accordingly.
		for _, route := range el.group.Routes {
			var mdws []echo.MiddlewareFunc
			if !route.IsAnonymous {
				mdws = append(mdws, a.jwtMiddleware)
			}
			route.Register(group, mdws...)
		}
	}
}

func (a *api) collectRoutes() []*shared.Group {
	apiGroup := &shared.Group{Path: "/api"}
	for _, ept := range a.apiEndpoints {
		ept.CollectRoutes(apiGroup)
	}
	apiV1Group := &shared.Group{Path: shared.APIV1Prefix}
	for _, ept := range a.apiV1Endpoints {
		ept.CollectRoutes(apiV1Group)
	}
	return []*shared.Group{apiGroup, apiV1Group}
}
