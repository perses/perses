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

// Code generated. DO NOT EDIT

package dashboard

import (
	"fmt"
	"net/http"

	"cuelang.org/go/cue"
	"cuelang.org/go/cue/cuecontext"
	"github.com/labstack/echo/v4"
	"github.com/sirupsen/logrus"

	"github.com/perses/perses/internal/api/authorization"
	dashboardSchema "github.com/perses/perses/internal/api/dashboard/schema"
	apiinterface "github.com/perses/perses/internal/api/interface"
	"github.com/perses/perses/internal/api/interface/v1/dashboard"
	"github.com/perses/perses/internal/api/plugin"
	"github.com/perses/perses/internal/api/plugin/schema"
	"github.com/perses/perses/internal/api/route"
	"github.com/perses/perses/internal/api/toolbox"
	"github.com/perses/perses/internal/api/utils"
	v1 "github.com/perses/perses/pkg/model/api/v1"
	v1plugin "github.com/perses/perses/pkg/model/api/v1/plugin"
)

type endpoint struct {
	toolbox     toolbox.Toolbox[*v1.Dashboard, *dashboard.Query]
	pluginSvc   plugin.Plugin
	schemasPath string
	readonly    bool
}

func NewEndpoint(service dashboard.Service, pluginService plugin.Plugin, authz authorization.Authorization, readonly bool, caseSensitive bool, schemasPath string) route.Endpoint {
	return &endpoint{
		toolbox:     toolbox.New[*v1.Dashboard, *v1.Dashboard, *dashboard.Query](service, authz, v1.KindDashboard, caseSensitive),
		pluginSvc:   pluginService,
		schemasPath: schemasPath,
		readonly:    readonly,
	}
}

func (e *endpoint) CollectRoutes(g *route.Group) {
	group := g.Group(fmt.Sprintf("/%s", utils.PathDashboard))
	subGroup := g.Group(fmt.Sprintf("/%s/:%s/%s", utils.PathProject, utils.ParamProject, utils.PathDashboard))
	if !e.readonly {
		group.POST("", e.Create, false)
		subGroup.POST("", e.Create, false)
		subGroup.PUT(fmt.Sprintf("/:%s", utils.ParamName), e.Update, false)
		subGroup.DELETE(fmt.Sprintf("/:%s", utils.ParamName), e.Delete, false)
	}
	group.GET("", e.List, false)
	subGroup.GET("", e.List, false)
	subGroup.GET(fmt.Sprintf("/:%s", utils.ParamName), e.Get, false)
	group.GET("/schema", e.Schema, true)
}

func (e *endpoint) Create(ctx echo.Context) error {
	entity := &v1.Dashboard{}
	return e.toolbox.Create(ctx, entity)
}

func (e *endpoint) Update(ctx echo.Context) error {
	entity := &v1.Dashboard{}
	return e.toolbox.Update(ctx, entity)
}

func (e *endpoint) Delete(ctx echo.Context) error {
	return e.toolbox.Delete(ctx)
}

func (e *endpoint) Get(ctx echo.Context) error {
	return e.toolbox.Get(ctx)
}

func (e *endpoint) List(ctx echo.Context) error {
	q := &dashboard.Query{}
	return e.toolbox.List(ctx, q)
}

func (e *endpoint) Schema(ctx echo.Context) error {
	if e.schemasPath == "" {
		return ctx.JSON(http.StatusServiceUnavailable, map[string]string{"message": "dashboard schemas path is not configured"})
	}

	cueCtx := cuecontext.New()

	// grab plugin schemas & aggregate them into single cue value per plugin kind
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

	// load the dashboard #Spec
	spec, err := dashboardSchema.Load(cueCtx, e.schemasPath)
	if err != nil {
		logrus.WithError(err).Error("unable to load dashboard schema")
		return apiinterface.InternalError
	}

	// inject plugin disjunctions into the dashboard schema
	result, err := dashboardSchema.MergeWithPlugins(cueCtx, spec, plugins)
	if err != nil {
		logrus.WithError(err).Error("unable to merge dashboard schema with plugin schemas")
		return apiinterface.InternalError
	}

	data, err := schema.ExportToCUE(result)
	if err != nil {
		logrus.WithError(err).Error("unable to export dashboard schema as CUE")
		return apiinterface.InternalError
	}
	return ctx.Blob(http.StatusOK, "text/x-cue", data)
}

func (e *endpoint) SchemaV2(ctx echo.Context) error {
	if e.schemasPath == "" {
		return ctx.JSON(http.StatusServiceUnavailable, map[string]string{"message": "dashboard schemas path is not configured"})
	}

	cueCtx := cuecontext.New()

	// grab plugin schemas & aggregate them into single cue value per plugin kind
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

	// load the dashboard #Spec
	spec, err := dashboardSchema.Load(cueCtx, e.schemasPath)
	if err != nil {
		logrus.WithError(err).Error("unable to load dashboard schema")
		return apiinterface.InternalError
	}

	// inject plugin disjunctions into the dashboard schema
	result, err := dashboardSchema.MergeWithPlugins(cueCtx, spec, plugins)
	if err != nil {
		logrus.WithError(err).Error("unable to merge dashboard schema with plugin schemas")
		return apiinterface.InternalError
	}

	data, err := schema.ExportToCUE(result)
	if err != nil {
		logrus.WithError(err).Error("unable to export dashboard schema as CUE")
		return apiinterface.InternalError
	}
	return ctx.Blob(http.StatusOK, "text/x-cue", data)
}
