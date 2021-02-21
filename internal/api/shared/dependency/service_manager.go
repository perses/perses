// The package dependency provides different manager that will be used to instantiate the different services and daos of the API.
// It's one way to inject the different dependencies into the different services/daos.
package dependency

import (
	projectImpl "github.com/perses/perses/internal/api/impl/v1/project"
	"github.com/perses/perses/internal/api/interface/v1/project"
)

type ServiceManager interface {
	GetProject() project.Service
}

type service struct {
	ServiceManager
	project project.Service
}

func NewServiceManager(dao PersistenceManager) ServiceManager {
	projectService := projectImpl.NewService(dao.GetProject())
	return &service{
		project: projectService,
	}
}

func (s *service) GetProject() project.Service {
	return s.project
}
