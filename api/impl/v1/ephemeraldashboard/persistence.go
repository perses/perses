// Copyright 2024 The Perses Authors
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

package ephemeraldashboard

import (
	"encoding/json"

	databaseModel "github.com/perses/perses/api/database/model"
	"github.com/perses/perses/api/interface/v1/ephemeraldashboard"
	"github.com/perses/perses/pkg/model/api"
	v1 "github.com/perses/perses/pkg/model/api/v1"
)

type dao struct {
	ephemeraldashboard.DAO
	client databaseModel.DAO
	kind   v1.Kind
}

func NewDAO(persesDAO databaseModel.DAO) ephemeraldashboard.DAO {
	return &dao{
		client: persesDAO,
		kind:   v1.KindEphemeralDashboard,
	}
}

func (d *dao) Create(entity *v1.EphemeralDashboard) error {
	return d.client.Create(entity)
}

func (d *dao) Update(entity *v1.EphemeralDashboard) error {
	return d.client.Upsert(entity)
}

func (d *dao) Delete(project string, name string) error {
	return d.client.Delete(d.kind, v1.NewProjectMetadata(project, name))
}

func (d *dao) DeleteAll(project string) error {
	return d.client.DeleteByQuery(&ephemeraldashboard.Query{Project: project})
}

func (d *dao) Get(project string, name string) (*v1.EphemeralDashboard, error) {
	entity := &v1.EphemeralDashboard{}
	return entity, d.client.Get(d.kind, v1.NewProjectMetadata(project, name), entity)
}

func (d *dao) List(q *ephemeraldashboard.Query) ([]*v1.EphemeralDashboard, error) {
	var result []*v1.EphemeralDashboard
	err := d.client.Query(q, &result)
	return result, err
}

func (d *dao) RawList(q *ephemeraldashboard.Query) ([]json.RawMessage, error) {
	return d.client.RawQuery(q)
}

func (d *dao) MetadataList(q *ephemeraldashboard.Query) ([]api.Entity, error) {
	var list []*v1.PartialProjectEntity
	err := d.client.Query(q, &list)
	result := make([]api.Entity, 0, len(list))
	for _, el := range list {
		result = append(result, el)
	}
	return result, err
}

func (d *dao) RawMetadataList(q *ephemeraldashboard.Query) ([]json.RawMessage, error) {
	return d.client.RawMetadataQuery(q, d.kind)
}
