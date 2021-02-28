package shared

import "github.com/labstack/echo/v4"

const (
	ParamName   = "name"
	APIV1Prefix = "/api/v1"
	PathProject = "projects"
)

func getNameParameter(ctx echo.Context) string {
	return ctx.Param(ParamName)
}
