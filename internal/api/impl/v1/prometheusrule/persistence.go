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

package prometheusrule

import (
	"time"

	"github.com/perses/common/etcd"
	"github.com/perses/perses/internal/api/interface/v1/prometheusrule"
	v1 "github.com/perses/perses/pkg/model/api/v1"
	"go.etcd.io/etcd/clientv3"
)

type dao struct {
	prometheusrule.DAO
	client etcd.DAO
}

func NewDAO(etcdClient *clientv3.Client, timeout time.Duration) prometheusrule.DAO {
	client := etcd.NewDAO(etcdClient, timeout)
	return &dao{
		client: client,
	}
}

func (d *dao) Create(entity *v1.PrometheusRule) error {
	key := entity.GenerateID()
	return d.client.Create(key, entity)
}

func (d *dao) Update(entity *v1.PrometheusRule) error {
	key := entity.GenerateID()
	return d.client.Upsert(key, entity)
}

func (d *dao) Delete(project string, name string) error {
	key := v1.GeneratePrometheusRuleID(project, name)
	return d.client.Delete(key)
}

func (d *dao) Get(project string, name string) (*v1.PrometheusRule, error) {
	key := v1.GeneratePrometheusRuleID(project, name)
	entity := &v1.PrometheusRule{}
	return entity, d.client.Get(key, entity)
}

func (d *dao) List(q etcd.Query) ([]*v1.PrometheusRule, error) {
	var result []*v1.PrometheusRule
	err := d.client.Query(q, &result)
	return result, err
}
