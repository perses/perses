// Copyright 2021 Amadeus s.a.s
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

package dashboard_feed

import (
	"fmt"
	"net/http"

	"github.com/labstack/echo/v4"
	"github.com/perses/perses/internal/api/interface/v1/dashboard_feed"
	"github.com/perses/perses/internal/api/shared"
	v1 "github.com/perses/perses/pkg/model/api/v1"
)

type Endpoint struct {
	service dashboard_feed.Service
}

func NewEndpoint(service dashboard_feed.Service) *Endpoint {
	return &Endpoint{
		service: service,
	}
}

func (e *Endpoint) RegisterRoutes(g *echo.Group) {
	group := g.Group("/feed")
	group.POST("/sections", e.FeedSection)
}

func (e *Endpoint) FeedSection(ctx echo.Context) error {
	body := &v1.SectionFeedRequest{}
	if err := ctx.Bind(body); err != nil {
		return shared.HandleError(fmt.Errorf("%w: %s", shared.BadRequestError, err))
	}
	response, err := e.service.FeedSection(body)
	if err != nil {
		return shared.HandleError(err)
	}
	return ctx.JSON(http.StatusOK, response)
}
