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

package globaldatasource

import (
	"github.com/perses/perses/internal/api/interface/v1/globaldatasource"
	databaseModel "github.com/perses/perses/internal/api/shared/database/model"
	v1 "github.com/perses/perses/pkg/model/api/v1"
)

type dao struct {
	globaldatasource.DAO
	client databaseModel.DAO
	kind   v1.Kind
}

func NewDAO(persesDAO databaseModel.DAO) globaldatasource.DAO {
	return &dao{
		client: persesDAO,
		kind:   v1.KindGlobalDatasource,
	}
}

func (d *dao) Create(entity *v1.GlobalDatasource) error {
	return d.client.Create(entity)
}

func (d *dao) Update(entity *v1.GlobalDatasource) error {
	return d.client.Upsert(entity)
}

func (d *dao) Delete(name string) error {
	return d.client.Delete(d.kind, v1.NewMetadata(name))
}

func (d *dao) Get(name string) (*v1.GlobalDatasource, error) {
	entity := &v1.GlobalDatasource{}
	return entity, d.client.Get(d.kind, v1.NewMetadata(name), entity)
}

func (d *dao) List(q databaseModel.Query) ([]*v1.GlobalDatasource, error) {
	var result []*v1.GlobalDatasource
	err := d.client.Query(q, &result)
	return result, err
}
