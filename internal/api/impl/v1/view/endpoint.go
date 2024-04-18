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

package view

import (
	"fmt"

	"github.com/labstack/echo/v4"
	"github.com/perses/perses/internal/api/crypto"
	apiInterface "github.com/perses/perses/internal/api/interface"
	"github.com/perses/perses/internal/api/interface/v1/dashboard"
	"github.com/perses/perses/internal/api/interface/v1/view"
	"github.com/perses/perses/internal/api/rbac"
	"github.com/perses/perses/internal/api/route"
	"github.com/perses/perses/internal/api/utils"
	v1 "github.com/perses/perses/pkg/model/api/v1"
	"github.com/perses/perses/pkg/model/api/v1/role"
)

type endpoint struct {
	dashboardService dashboard.Service
	service          view.Service
	rbac             rbac.RBAC
}

func NewEndpoint(service view.Service, rbac rbac.RBAC, dashboardService dashboard.Service) route.Endpoint {
	return &endpoint{
		service:          service,
		rbac:             rbac,
		dashboardService: dashboardService,
	}
}

func (e *endpoint) CollectRoutes(g *route.Group) {
	g.POST(fmt.Sprintf("/%s", utils.PathView), e.view, false)
}

func (e *endpoint) view(ctx echo.Context) error {
	view := v1.View{}
	if err := ctx.Bind(&view); err != nil {
		return apiInterface.HandleBadRequestError(err.Error())
	}

	claims := crypto.ExtractJWTClaims(ctx)
	if claims == nil {
		return apiInterface.HandleUnauthorizedError("missing claims")
	}

	if ok := e.rbac.HasPermission(claims.Subject, role.ReadAction, view.Project, role.DashboardScope); !ok {
		return apiInterface.HandleUnauthorizedError(fmt.Sprintf("missing '%s' permission in '%s' project for '%s' kind", role.ReadAction, view.Project, role.DashboardScope))
	}

	if _, err := e.dashboardService.Get(apiInterface.NewPersesContext(ctx), apiInterface.Parameters{
		Project: view.Project,
		Name:    view.Dashboard,
	}); err != nil {
		return apiInterface.HandleNotFoundError(err.Error())
	}

	return e.service.View(&view)
}
