package health

import (
	v1 "github.com/perses/perses/pkg/model/api/v1"
)

type DAO interface {
	HealthCheck() bool
}

type Service interface {
	HealthCheck() *v1.Health
}
