// Copyright 2021 Amadeus s.a.s
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

package dashboard

import (
	"github.com/perses/common/etcd"
	"github.com/perses/perses/internal/api/interface/v1/dashboard"
	"github.com/perses/perses/internal/api/shared/database"
	v1 "github.com/perses/perses/pkg/model/api/v1"
)

type dao struct {
	dashboard.DAO
	client database.DAO
}

func NewDAO(persesDAO database.DAO) dashboard.DAO {
	return &dao{
		client: persesDAO,
	}
}

func (d *dao) Create(entity *v1.Dashboard) error {
	key := entity.GenerateID()
	return d.client.Create(key, entity)
}

func (d *dao) Update(entity *v1.Dashboard) error {
	key := entity.GenerateID()
	return d.client.Upsert(key, entity)
}

func (d *dao) Delete(project string, name string) error {
	key := v1.GenerateDashboardID(project, name)
	return d.client.Delete(key)
}

func (d *dao) Get(project string, name string) (*v1.Dashboard, error) {
	key := v1.GenerateDashboardID(project, name)
	entity := &v1.Dashboard{}
	return entity, d.client.Get(key, entity)
}

func (d *dao) List(q etcd.Query) ([]*v1.Dashboard, error) {
	var result []*v1.Dashboard
	err := d.client.Query(q, &result)
	return result, err
}
