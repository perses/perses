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
	"strings"

	"cuelang.org/go/cue"
	"cuelang.org/go/cue/cuecontext"
	"github.com/labstack/echo/v4"
	"github.com/sirupsen/logrus"

	apiCue "github.com/perses/perses/internal/api/cue"
	dashboardSchema "github.com/perses/perses/internal/api/dashboard/schema"
	apiinterface "github.com/perses/perses/internal/api/interface"
	"github.com/perses/perses/internal/api/plugin"
	"github.com/perses/perses/internal/api/plugin/schema"
	"github.com/perses/perses/internal/api/route"
	"github.com/perses/perses/internal/api/utils"
	specPlugin "github.com/perses/spec/go/plugin"
)

const (
	pluginNameParam = "pluginName"
	contentType     = "text/x-cue"
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
	cueCtx := cuecontext.New()

	// grab plugin schemas & aggregate them into a single cue value per plugin kind
	plugins := map[specPlugin.Kind]cue.Value{}
	for _, kind := range []specPlugin.Kind{specPlugin.KindDatasource, specPlugin.KindPanel, specPlugin.KindVariable, specPlugin.KindQuery} {
		schemas := e.pluginSvc.Schema().GetSchemas(kind)
		if len(schemas) == 0 {
			continue
		}
		merged, err := schema.GenerateSchemaDisjunction(cueCtx, schemas)
		if err != nil {
			logrus.WithError(err).Errorf("unable to merge %s plugin schemas", kind)
			return apiinterface.InternalError
		}
		plugins[kind] = merged
	}

	// inject plugin cue values into the dashboard schema
	result, err := dashboardSchema.GenerateDashboardCueValue(cueCtx, plugins)
	if err != nil {
		logrus.WithError(err).Error("unable to merge dashboard schema with plugin schemas")
		return apiinterface.InternalError
	}

	data, err := apiCue.MarshalCUE(result)
	if err != nil {
		logrus.WithError(err).Error("unable to export dashboard schema as CUE")
		return apiinterface.InternalError
	}
	return ctx.Blob(http.StatusOK, contentType, data)
}

func (e *endpoint) PluginDefinition(ctx echo.Context) error {
	pluginName := ctx.Param(pluginNameParam)
	var plugins []schema.LoadSchema

	schemas := e.pluginSvc.Schema().GetAllSchemas()
	if len(schemas) == 0 {
		return ctx.Blob(http.StatusOK, contentType, []byte("{}"))
	}
	for _, ls := range schemas {
		if strings.EqualFold(ls.Name, pluginName) {
			plugins = append(plugins, ls)
		}
	}
	if len(plugins) == 0 {
		return apiinterface.HandleNotFoundError("plugin not found")
	}
	data, err := generateCUEbytes(plugins)
	if err != nil {
		return err
	}

	return ctx.Blob(http.StatusOK, contentType, data)
}

func (e *endpoint) PluginList(ctx echo.Context) error {
	schemas := e.pluginSvc.Schema().GetAllSchemas()
	if len(schemas) == 0 {
		return ctx.Blob(http.StatusOK, contentType, []byte("{}"))
	}
	data, err := generateCUEbytes(schemas)
	if err != nil {
		return err
	}

	return ctx.Blob(http.StatusOK, contentType, data)
}

func generateCUEbytes(ls []schema.LoadSchema) ([]byte, error) {
	cueCtx := cuecontext.New()
	list, err := schema.GenerateSchemaDefinitions(cueCtx, ls)
	if err != nil {
		logrus.WithError(err).Error("unable to generate plugins schema definition")
		return nil, apiinterface.InternalError
	}

	data, exportErr := apiCue.MarshalCUE(list)
	if exportErr != nil {
		logrus.WithError(exportErr).Error("unable to export plugin schemas as CUE")
		return nil, apiinterface.InternalError
	}
	return data, nil
}
