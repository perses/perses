// Copyright The Perses Authors
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
// https://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

package search

import (
	"fmt"
	"net/http"

	"github.com/labstack/echo/v4"
	"github.com/perses/perses/internal/api/index"
	apiInterface "github.com/perses/perses/internal/api/interface"
	"github.com/perses/perses/internal/api/route"
	"github.com/perses/perses/internal/api/utils"
	v1 "github.com/perses/perses/pkg/model/api/v1"
)

type endpoint struct {
	index index.Client
}

func NewEndpoint(index index.Client) route.Endpoint {
	return &endpoint{
		index: index,
	}
}

func (e *endpoint) CollectRoutes(g *route.Group) {
	group := g.Group(fmt.Sprintf("/%s", utils.PathSearch))
	group.GET(fmt.Sprintf("/%s", utils.PathDashboard), e.Dashboard, false)
}

func (e *endpoint) Dashboard(ctx echo.Context) error {
	q := &index.Query{}
	if err := ctx.Bind(q); err != nil {
		return apiInterface.HandleBadRequestError(err.Error())
	}
	var result []*index.SearchResult
	var err error
	if q.Query == "" {
		result, err = e.index.List(ctx, v1.KindDashboard, q.Project)
	} else {
		result, err = e.index.Search(ctx, v1.KindDashboard, q.Project, q.Query)
	}
	if err != nil {
		return err
	}
	return ctx.JSON(http.StatusOK, result)
}
