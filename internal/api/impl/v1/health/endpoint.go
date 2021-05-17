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
