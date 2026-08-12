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
	"github.com/perses/perses/pkg/model/api/v1/search"
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
	q := &search.Query{}
	if err := ctx.Bind(q); err != nil {
		return apiInterface.HandleBadRequestError(err.Error())
	}
	result, err := e.index.Search(ctx, v1.KindDashboard, q.Project, q.Query)
	if err != nil {
		return err
	}
	return ctx.JSON(http.StatusOK, result)
}
