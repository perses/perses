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
	apiInterface "github.com/perses/perses/internal/api/interface"
	"github.com/perses/perses/internal/api/interface/v1/view"
	"github.com/perses/perses/internal/api/route"
	"github.com/perses/perses/internal/api/utils"
	v1 "github.com/perses/perses/pkg/model/api/v1"
)

type endpoint struct {
	service view.Service
}

func NewEndpoint(service view.Service) route.Endpoint {
	return &endpoint{
		service: service,
	}
}

func (e *endpoint) CollectRoutes(g *route.Group) {
	g.POST(fmt.Sprintf("/%s", utils.PathView), e.View, false)
}

func (e *endpoint) View(ctx echo.Context) error {
	view := v1.View{}
	if err := ctx.Bind(&view); err != nil {
		return apiInterface.HandleBadRequestError(err.Error())
	}

	if err := view.Validate(); err != nil {
		return apiInterface.HandleBadRequestError(err.Error())
	}

	return e.service.View(&view)
}
