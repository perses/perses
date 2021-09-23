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

package health

import (
	"net/http"

	"github.com/labstack/echo/v4"
	"github.com/perses/perses/internal/api/interface/v1/health"
)

// Endpoint is the struct that define all endpoint delivered by the path /health
type Endpoint struct {
	service health.Service
}

// NewEndpoint create an instance of the object Endpoint.
// You should have at most one instance of this object as it is only used by the struct api in the method api.registerRoute
func NewEndpoint(service health.Service) *Endpoint {
	return &Endpoint{
		service: service,
	}
}

// RegisterRoutes is the method to use to register the routes prefixed by /api
// If the version is not v1, then look at the same method but in the package with the version as the name.
func (e *Endpoint) RegisterRoutes(g *echo.Group) {
	g.GET("/health", e.Check)
}

// Check is the endpoint that provide the health status of the API.
func (e *Endpoint) Check(ctx echo.Context) error {
	healthData := e.service.HealthCheck()

	if !healthData.Database {
		return ctx.JSON(http.StatusServiceUnavailable, healthData)
	}
	return ctx.JSON(http.StatusOK, healthData)
}
