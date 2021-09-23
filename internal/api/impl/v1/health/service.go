// Copyright 2021 The Perses Authors
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

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
