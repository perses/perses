package shared

import (
	"github.com/labstack/echo/v4"
)

type ToolboxService interface {
	Create(entity interface{}) (interface{}, error)
}

// Toolbox is an interface that defines the different methods that can be used in the different endpoint of the API.
// This is a way to align the code of the different endpoint.
type Toolbox interface {
	Create(ctx echo.Context, entity interface{}) error
}

func NewToolBox(service ToolboxService) Toolbox {
	return &toolboxImpl{
		service: service,
	}
}

type toolboxImpl struct {
	Toolbox
	service ToolboxService
}

func (t *toolboxImpl) Create(ctx echo.Context, entity interface{}) error {
	if err := ctx.Bind(entity); err != nil {
		return err
	}
	return nil
}
