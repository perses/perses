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

package dependency

import (
	"time"

	"github.com/perses/common/config"
	"github.com/perses/common/etcd"
	projectImpl "github.com/perses/perses/internal/api/impl/v1/project"
	prometheusruleImpl "github.com/perses/perses/internal/api/impl/v1/prometheusrule"
	"github.com/perses/perses/internal/api/interface/v1/project"
	"github.com/perses/perses/internal/api/interface/v1/prometheusrule"
	"go.etcd.io/etcd/clientv3"
)

type PersistenceManager interface {
	GetProject() project.DAO
	GetPrometheusRule() prometheusrule.DAO
	GetETCDClient() *clientv3.Client
}

type persistence struct {
	PersistenceManager
	project        project.DAO
	prometheusRule prometheusrule.DAO
	etcdClient     *clientv3.Client
}

func NewPersistenceManager(conf config.EtcdConfig) (PersistenceManager, error) {
	timeout := time.Duration(conf.RequestTimeoutSeconds) * time.Second
	etcdClient, err := etcd.NewETCDClient(conf)
	if err != nil {
		return nil, err
	}
	projectDAO := projectImpl.NewDAO(etcdClient, timeout)
	prometheusRuleDAO := prometheusruleImpl.NewDAO(etcdClient, timeout)
	return &persistence{
		project:        projectDAO,
		prometheusRule: prometheusRuleDAO,
		etcdClient:     etcdClient,
	}, nil
}

func (p *persistence) GetProject() project.DAO {
	return p.project
}

func (p *persistence) GetPrometheusRule() prometheusrule.DAO {
	return p.prometheusRule
}

func (p *persistence) GetETCDClient() *clientv3.Client {
	return p.etcdClient
}
