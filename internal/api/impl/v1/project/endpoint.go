package project

import (
	"github.com/labstack/echo/v4"
	"github.com/perses/perses/internal/api/interface/v1/project"
	"github.com/perses/perses/internal/api/shared"
	v1 "github.com/perses/perses/pkg/model/api/v1"
)

type Endpoint struct {
	toolbox shared.Toolbox
}

func NewEndpoint(service project.Service) *Endpoint {
	return &Endpoint{
		toolbox: shared.NewToolBox(service),
	}
}

func (e *Endpoint) RegisterRoutes(g *echo.Group) {
	projectGroup := g.Group("/projects")
	projectGroup.POST("", e.Create)
}

func (e *Endpoint) Create(ctx echo.Context) error {
	entity := &v1.Project{}
	return e.toolbox.Create(ctx, entity)
}
