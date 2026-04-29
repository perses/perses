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

	"cuelang.org/go/cue"
	"cuelang.org/go/cue/cuecontext"
	"github.com/labstack/echo/v4"
	"github.com/sirupsen/logrus"

	dashboardSchema "github.com/perses/perses/internal/api/dashboard/schema"
	apiinterface "github.com/perses/perses/internal/api/interface"
	"github.com/perses/perses/internal/api/plugin"
	"github.com/perses/perses/internal/api/plugin/schema"
	"github.com/perses/perses/internal/api/route"
	"github.com/perses/perses/internal/api/utils"
	v1plugin "github.com/perses/perses/pkg/model/api/v1/plugin"
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
	group.GET("/dashboard", e.DashboardSchema, true)
	group.GET("/plugin", e.PluginSchema, true)
}

func (e *endpoint) DashboardSchema(ctx echo.Context) error {
	cueCtx := cuecontext.New()

	// grab plugin schemas & aggregate them into a single cue value per plugin kind
	plugins := map[v1plugin.Kind]cue.Value{}
	for _, kind := range []v1plugin.Kind{v1plugin.KindDatasource, v1plugin.KindPanel, v1plugin.KindVariable, v1plugin.KindQuery} {
		schemas := e.pluginSvc.Schema().GetAllSchemasOfKind(kind)
		if len(schemas) == 0 {
			continue
		}
		merged, err := schema.MergeSchemas(cueCtx, schemas)
		if err != nil {
			logrus.WithError(err).Errorf("unable to merge %s plugin schemas", kind)
			return apiinterface.InternalError
		}
		plugins[kind] = merged
	}

	// load the dashboard schema
	spec, err := dashboardSchema.Load(cueCtx)
	if err != nil {
		logrus.WithError(err).Error("unable to load dashboard schema")
		return apiinterface.InternalError
	}

	// inject plugin cue values into the dashboard schema
	result, err := dashboardSchema.MergeWithPlugins(cueCtx, spec, plugins)
	if err != nil {
		logrus.WithError(err).Error("unable to merge dashboard schema with plugin schemas")
		return apiinterface.InternalError
	}

	data, err := utils.ExportToCUE(result)
	if err != nil {
		logrus.WithError(err).Error("unable to export dashboard schema as CUE")
		return apiinterface.InternalError
	}
	return ctx.Blob(http.StatusOK, "text/x-cue", data)
}

func (e *endpoint) PluginSchema(ctx echo.Context) error {
	// generate plugin cue values - done
	schemas := e.pluginSvc.Schema().GetAllSchemas()
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
	data, exportErr := utils.ExportToCUE(merged)
	if exportErr != nil {
		logrus.WithError(exportErr).Error("unable to export plugin schemas as CUE")
		return apiinterface.InternalError
	}
	return ctx.Blob(http.StatusOK, "text/x-cue", data)
}
