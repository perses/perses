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

package project

import (
	"time"

	"github.com/perses/common/etcd"
	"github.com/perses/perses/internal/api/interface/v1/project"
	v1 "github.com/perses/perses/pkg/model/api/v1"
	"go.etcd.io/etcd/clientv3"
)

type dao struct {
	project.DAO
	client etcd.DAO
}

func NewDAO(etcdClient *clientv3.Client, timeout time.Duration) project.DAO {
	client := etcd.NewDAO(etcdClient, timeout)
	return &dao{
		client: client,
	}
}

func (d *dao) Create(entity *v1.Project) error {
	key := entity.GenerateID()
	return d.client.Create(key, entity)
}

func (d *dao) Update(entity *v1.Project) error {
	key := entity.GenerateID()
	return d.client.Upsert(key, entity)
}

func (d *dao) Get(name string) (*v1.Project, error) {
	key := v1.GenerateProjectID(name)
	entity := &v1.Project{}
	return entity, d.client.Get(key, entity)
}

func (d *dao) Delete(name string) error {
	key := v1.GenerateProjectID(name)
	return d.client.Delete(key)
}
