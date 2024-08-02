// Copyright 2023 The Perses Authors
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

package globalvariable

import (
	"encoding/json"

	databaseModel "github.com/perses/perses/internal/api/database/model"
	"github.com/perses/perses/internal/api/interface/v1/globalvariable"
	"github.com/perses/perses/pkg/model/api"
	v1 "github.com/perses/perses/pkg/model/api/v1"
)

type dao struct {
	globalvariable.DAO
	client databaseModel.DAO
	kind   v1.Kind
}

func NewDAO(persesDAO databaseModel.DAO) globalvariable.DAO {
	return &dao{
		client: persesDAO,
		kind:   v1.KindGlobalVariable,
	}
}

func (d *dao) Create(entity *v1.GlobalVariable) error {
	return d.client.Create(entity)
}

func (d *dao) Update(entity *v1.GlobalVariable) error {
	return d.client.Upsert(entity)
}

func (d *dao) Delete(name string) error {
	return d.client.Delete(d.kind, v1.NewMetadata(name))
}

func (d *dao) Get(name string) (*v1.GlobalVariable, error) {
	entity := &v1.GlobalVariable{}
	return entity, d.client.Get(d.kind, v1.NewMetadata(name), entity)
}

func (d *dao) List(q *globalvariable.Query) ([]*v1.GlobalVariable, error) {
	var result []*v1.GlobalVariable
	err := d.client.Query(q, &result)
	return result, err
}

func (d *dao) RawList(q *globalvariable.Query) ([]json.RawMessage, error) {
	return d.client.RawQuery(q)
}

func (d *dao) MetadataList(q *globalvariable.Query) ([]api.Entity, error) {
	var list []*v1.PartialEntity
	err := d.client.Query(q, &list)
	result := make([]api.Entity, 0, len(list))
	for _, el := range list {
		result = append(result, el)
	}
	return result, err
}

func (d *dao) RawMetadataList(q *globalvariable.Query) ([]json.RawMessage, error) {
	return d.client.RawMetadataQuery(q, d.kind)
}
