package front

import (
	"github.com/labstack/echo/v4"
	echoUtils "github.com/perses/common/echo"
)

type endpoint interface {
	RegisterRoutes(g *echo.Group)
}

type frontend struct {
	echoUtils.Register
	endpoint endpoint
}

func NewPersesFrontend() echoUtils.Register {
	return &frontend{endpoint: &Endpoint{}}
}

func (a *frontend) RegisterRoute(e *echo.Echo) {
	frontGroup := e.Group("")
	a.endpoint.RegisterRoutes(frontGroup)
}
