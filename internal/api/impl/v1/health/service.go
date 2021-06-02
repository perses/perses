package health

import (
	"github.com/perses/perses/internal/api/interface/v1/health"
	v1 "github.com/perses/perses/pkg/model/api/v1"
	"github.com/prometheus/common/version"
)

type serviceImpl struct {
	health.Service
	dao health.DAO
}

// NewService creates an instance of the interface Service
func NewService(dao health.DAO) health.Service {
	return &serviceImpl{
		dao: dao,
	}
}

func (s *serviceImpl) HealthCheck() *v1.Health {
	return &v1.Health{
		BuildTime: version.BuildDate,
		Version:   version.Version,
		Commit:    version.Revision,
		Database:  s.dao.HealthCheck(),
	}
}
