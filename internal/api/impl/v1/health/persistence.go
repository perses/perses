package health

import (
	"github.com/perses/perses/internal/api/interface/v1/health"
	"github.com/perses/perses/internal/api/shared/database"
)

type dao struct {
	health.DAO
	client database.DAO
}

func NewDAO(persesDAO database.DAO) health.DAO {
	return &dao{
		client: persesDAO,
	}
}

func (d *dao) HealthCheck() bool {
	return d.client.HealthCheck()
}
