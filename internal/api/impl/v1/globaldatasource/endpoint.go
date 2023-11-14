// Copyright 2023 The Perses Authors
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

package globaldatasource

import (
	"fmt"
	"github.com/labstack/echo/v4"
	"github.com/perses/perses/internal/api/interface/v1/globaldatasource"
	"github.com/perses/perses/internal/api/shared"
	"github.com/perses/perses/internal/api/shared/authorization"
	v1 "github.com/perses/perses/pkg/model/api/v1"
)

type Endpoint struct {
	toolbox  shared.Toolbox
	readonly bool
}

func NewEndpoint(service globaldatasource.Service, rbacService authorization.RBAC, readonly bool) *Endpoint {
	return &Endpoint{
		toolbox:  shared.NewToolBox(service, rbacService, v1.KindGlobalDatasource),
		readonly: readonly,
	}
}

func (e *Endpoint) CollectRoutes(g *shared.Group) {
	group := g.Group(fmt.Sprintf("/%s", shared.PathGlobalDatasource))

	if !e.readonly {
		group.POST("", e.Create, false)
		group.PUT(fmt.Sprintf("/:%s", shared.ParamName), e.Update, false)
		group.DELETE(fmt.Sprintf("/:%s", shared.ParamName), e.Delete, false)
	}
	group.GET("", e.List, false)
	group.GET(fmt.Sprintf("/:%s", shared.ParamName), e.Get, false)
}

func (e *Endpoint) Create(ctx echo.Context) error {
	entity := &v1.GlobalDatasource{}
	return e.toolbox.Create(ctx, entity)
}

func (e *Endpoint) Update(ctx echo.Context) error {
	entity := &v1.GlobalDatasource{}
	return e.toolbox.Update(ctx, entity)
}

func (e *Endpoint) Delete(ctx echo.Context) error {
	return e.toolbox.Delete(ctx)
}

func (e *Endpoint) Get(ctx echo.Context) error {
	return e.toolbox.Get(ctx)
}

func (e *Endpoint) List(ctx echo.Context) error {
	q := &globaldatasource.Query{}
	return e.toolbox.List(ctx, q)
}
