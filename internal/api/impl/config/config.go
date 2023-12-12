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

package configendpoint

import (
	"net/http"

	"github.com/labstack/echo/v4"
	"github.com/perses/perses/internal/api/shared/route"
	"github.com/perses/perses/pkg/model/api/config"
)

type endpoint struct {
	cfg config.Config
}

func New(cfg config.Config) route.Endpoint {
	return &endpoint{
		cfg: cfg,
	}
}

func (e *endpoint) CollectRoutes(g *route.Group) {
	g.GET("/config", e.getConfig, true)
}

func (e *endpoint) getConfig(ctx echo.Context) error {
	return ctx.JSON(http.StatusOK, e.cfg)
}
