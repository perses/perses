// Copyright 2024 The Perses Authors
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

package plugin

import (
	"net/http"

	"github.com/labstack/echo/v4"
	apiinterface "github.com/perses/perses/internal/api/interface"
	"github.com/perses/perses/internal/api/plugin"
	"github.com/perses/perses/internal/api/route"
	v1 "github.com/perses/perses/pkg/model/api/v1"
	"github.com/sirupsen/logrus"
)

type endpoint struct {
	svc       plugin.Plugin
	enableDev bool
}

func NewEndpoint(svc plugin.Plugin, enableDev bool) route.Endpoint {
	return &endpoint{
		svc:       svc,
		enableDev: enableDev,
	}
}

func (e *endpoint) CollectRoutes(g *route.Group) {
	group := g.Group("/plugins")
	group.GET("", e.List, true)
	if e.enableDev {
		group.POST("", e.PushDevPlugin, true)
	}
}

func (e *endpoint) List(ctx echo.Context) error {
	d, err := e.svc.List()
	if err != nil {
		logrus.WithError(err).Error("unable to list plugins")
		return apiinterface.InternalError
	}
	return ctx.Blob(http.StatusOK, "application/json", d)
}

func (e *endpoint) PushDevPlugin(ctx echo.Context) error {
	var list []v1.PluginInDevelopment
	if err := ctx.Bind(&list); err != nil {
		return apiinterface.HandleBadRequestError(err.Error())
	}
	return e.svc.LoadDevPlugin(list)
}
