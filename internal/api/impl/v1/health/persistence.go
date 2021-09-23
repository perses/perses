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
