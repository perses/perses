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

package schema

import (
	"fmt"
	"net/http"

	"github.com/labstack/echo/v4"
	"github.com/sirupsen/logrus"

	apiinterface "github.com/perses/perses/internal/api/interface"
	"github.com/perses/perses/internal/api/plugin"
	"github.com/perses/perses/internal/api/route"
	"github.com/perses/perses/internal/api/utils"
	specPlugin "github.com/perses/spec/go/plugin"
)

const (
	pluginNameParam    = "pluginName"
	versionQueryParam  = "version"
	registryQueryParam = "registry"
	contentType        = "text/x-cue"
)

type endpoint struct {
	pluginSvc plugin.Plugin
	readonly  bool
}

func NewEndpoint(pluginService plugin.Plugin, readonly bool) route.Endpoint {
	return &endpoint{
		pluginSvc: pluginService,
		readonly:  readonly,
	}
}

func (e *endpoint) CollectRoutes(g *route.Group) {
	group := g.Group(fmt.Sprintf("/%s", utils.PathSchemas))
	group.GET("/dashboards", e.DashboardSchema, true)
	group.GET("/plugins", e.PluginList, true)
	group.GET(fmt.Sprintf("/plugins/:%s", pluginNameParam), e.PluginDefinition, true)
}

func (e *endpoint) DashboardSchema(ctx echo.Context) error {
	data, err := e.pluginSvc.Schema().GenerateDashboardSchemaBytes()
	if err != nil {
		logrus.WithError(err).Error("unable to generate dashboard schema")
		return apiinterface.InternalError
	}
	return ctx.Blob(http.StatusOK, contentType, data)
}

func (e *endpoint) PluginDefinition(ctx echo.Context) error {
	pluginName := ctx.Param(pluginNameParam)
	version := ctx.QueryParam(versionQueryParam)
	registry := ctx.QueryParam(registryQueryParam)

	if version == "" {
		version = specPlugin.LatestVersion
	}
	if registry == "" {
		registry = specPlugin.DefaultRegistry
	}

	data, ok, err := e.pluginSvc.Schema().GetSchemaBytes(pluginName, version, registry)
	if err != nil {
		logrus.WithError(err).Error("unable to get plugin schema")
		return apiinterface.InternalError
	}
	if !ok {
		return apiinterface.HandleNotFoundError(fmt.Sprintf("plugin %q not found", pluginName))
	}
	return ctx.Blob(http.StatusOK, contentType, data)
}

func (e *endpoint) PluginList(ctx echo.Context) error {
	data, err := e.pluginSvc.Schema().GetAllSchemasBytes()
	if err != nil {
		logrus.WithError(err).Error("unable to list plugin schemas")
		return apiinterface.InternalError
	}
	return ctx.Blob(http.StatusOK, contentType, data)
}
