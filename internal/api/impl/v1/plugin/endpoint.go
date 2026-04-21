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

package plugin

import (
	"net/http"

	"cuelang.org/go/cue/cuecontext"
	"github.com/labstack/echo/v4"
	apiinterface "github.com/perses/perses/internal/api/interface"
	"github.com/perses/perses/internal/api/plugin"
	"github.com/perses/perses/internal/api/plugin/schema"
	"github.com/perses/perses/internal/api/route"
	v1 "github.com/perses/perses/pkg/model/api/v1"
	pluginModel "github.com/perses/perses/pkg/model/api/v1/plugin"
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
		devGroup := group.Group("/dev")
		devGroup.POST("", e.PushDevPlugin, true)
		devGroup.DELETE("", e.DeleteDevPlugin, true)
		devGroup.POST("/refresh", e.RefreshDevPlugin, true)
	}
	group.GET("/schema", e.Schema, true)
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

func (e *endpoint) RefreshDevPlugin(ctx echo.Context) error {
	var pluginMetadata pluginModel.ModuleMetadata
	if err := ctx.Bind(&pluginMetadata); err != nil {
		return apiinterface.HandleBadRequestError(err.Error())
	}
	if err := e.svc.RefreshDevPlugin(pluginMetadata); err != nil {
		logrus.WithError(err).Errorf("unable to refresh plugin %q with the version %q", pluginMetadata.Name, pluginMetadata.Version)
		return err
	}
	return ctx.NoContent(http.StatusNoContent)
}

func (e *endpoint) DeleteDevPlugin(ctx echo.Context) error {
	var pluginMetadata pluginModel.ModuleMetadata
	if err := ctx.Bind(&pluginMetadata); err != nil {
		return apiinterface.HandleBadRequestError(err.Error())
	}
	if err := e.svc.UnLoadDevPlugin(pluginMetadata); err != nil {
		logrus.WithError(err).Errorf("unable to unload plugin %q with the version %q", pluginMetadata.Name, pluginMetadata.Version)
		return err
	}
	return ctx.NoContent(http.StatusNoContent)
}

func (e *endpoint) Schema(ctx echo.Context) error {
	// generate plugin cue values - done
	schemas := e.svc.Schema().GetAllSchemas()
	if len(schemas) == 0 {
		return ctx.Blob(http.StatusOK, "application/schema+json", []byte("{}"))
	}
	// merge
	cueCtx := cuecontext.New()
	merged, err := schema.MergeSchemas(cueCtx, schemas)
	if err != nil {
		logrus.WithError(err).Error("unable to merge plugin schemas")
		return apiinterface.InternalError
	}
	data, exportErr := schema.ExportToCUE(merged)
	if exportErr != nil {
		logrus.WithError(exportErr).Error("unable to export plugin schemas as CUE")
		return apiinterface.InternalError
	}
	return ctx.Blob(http.StatusOK, "text/x-cue", data)
}
