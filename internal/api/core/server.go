package core

import (
	"github.com/labstack/echo/v4"
	echoUtils "github.com/perses/common/echo"
	"github.com/perses/perses/internal/api/impl/v1/project"
	"github.com/perses/perses/internal/api/shared/dependency"
)

type endpoint interface {
	RegisterRoutes(g *echo.Group)
}

type api struct {
	echoUtils.Register
	endpoints []endpoint
}

func NewPersesAPI(serviceManager dependency.ServiceManager) echoUtils.Register {
	projectEndpoint := project.NewEndpoint(serviceManager.GetProject())
	endpoints := []endpoint{
		projectEndpoint,
	}
	return &api{
		endpoints: endpoints,
	}
}

func (a *api) RegisterRoute(e *echo.Echo) {
	a.registerAPIV1Route(e)
}

func (a *api) registerAPIV1Route(e *echo.Echo) {
	apiV1 := e.Group("/api/v1")
	for _, ept := range a.endpoints {
		ept.RegisterRoutes(apiV1)
	}
}
