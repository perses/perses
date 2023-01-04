// Copyright 2022 The Perses Authors
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

package migrate

import (
	"fmt"
	"net/http"

	"github.com/labstack/echo/v4"
	"github.com/perses/perses/internal/api/shared"
	"github.com/perses/perses/internal/api/shared/migrate"
	"github.com/perses/perses/pkg/model/api"
)

// Endpoint is the struct that define all endpoint delivered by the path /migrate
type Endpoint struct {
	migrationService migrate.Migration
}

// New create an instance of the object Endpoint.
// You should have at most one instance of this object as it is only used by the struct api in the method api.registerRoute
func New(migrationService migrate.Migration) *Endpoint {
	return &Endpoint{
		migrationService: migrationService,
	}
}

// RegisterRoutes is the method to use to register the routes prefixed by /api
// If the version is not v1, then look at the same method but in the package with the version as the name.
func (e *Endpoint) RegisterRoutes(g *echo.Group) {
	g.POST("/migrate", e.Migrate)
}

// Migrate is the endpoint that provides the Perses dashboard corresponding to the provided grafana dashboard.
func (e *Endpoint) Migrate(ctx echo.Context) error {
	body := &api.Migrate{}
	if err := ctx.Bind(body); err != nil {
		return shared.HandleError(fmt.Errorf("%w: %s", shared.BadRequestError, err))
	}
	grafanaDashboard := migrate.ReplaceInputValue(body.Input, string(body.GrafanaDashboard))
	persesDashboard, err := e.migrationService.Migrate([]byte(grafanaDashboard))
	if err != nil {
		return shared.HandleError(err)
	}

	return ctx.JSON(http.StatusOK, persesDashboard)
}
