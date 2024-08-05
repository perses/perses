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

package project

import (
	"encoding/json"

	databaseModel "github.com/perses/perses/internal/api/database/model"
	"github.com/perses/perses/internal/api/interface/v1/project"
	"github.com/perses/perses/pkg/model/api"
	v1 "github.com/perses/perses/pkg/model/api/v1"
)

type dao struct {
	project.DAO
	client databaseModel.DAO
	kind   v1.Kind
}

func NewDAO(persesDAO databaseModel.DAO) project.DAO {
	return &dao{
		client: persesDAO,
		kind:   v1.KindProject,
	}
}

func (d *dao) Create(entity *v1.Project) error {
	return d.client.Create(entity)
}

func (d *dao) Update(entity *v1.Project) error {
	return d.client.Upsert(entity)
}

func (d *dao) Get(name string) (*v1.Project, error) {
	entity := &v1.Project{}
	return entity, d.client.Get(d.kind, v1.NewMetadata(name), entity)
}

func (d *dao) Delete(name string) error {
	return d.client.Delete(d.kind, v1.NewMetadata(name))
}

func (d *dao) List(q *project.Query) ([]*v1.Project, error) {
	var result []*v1.Project
	err := d.client.Query(q, &result)
	return result, err
}

func (d *dao) RawList(q *project.Query) ([]json.RawMessage, error) {
	return d.client.RawQuery(q)
}

func (d *dao) MetadataList(q *project.Query) ([]api.Entity, error) {
	var list []*v1.PartialEntity
	err := d.client.Query(q, &list)
	result := make([]api.Entity, 0, len(list))
	for _, el := range list {
		result = append(result, el)
	}
	return result, err
}

func (d *dao) RawMetadataList(q *project.Query) ([]json.RawMessage, error) {
	return d.client.RawMetadataQuery(q, d.kind)
}
