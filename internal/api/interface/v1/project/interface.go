package project

import (
	"github.com/perses/perses/internal/api/shared"
	v1 "github.com/perses/perses/pkg/model/api/v1"
)

type DAO interface {
	Create(entity *v1.Project) error
}

type Service interface {
	shared.ToolboxService
}
