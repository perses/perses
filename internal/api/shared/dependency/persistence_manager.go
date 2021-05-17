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
	dashboardImpl "github.com/perses/perses/internal/api/impl/v1/dashboard"
	datasourceImpl "github.com/perses/perses/internal/api/impl/v1/datasource"
	healthImpl "github.com/perses/perses/internal/api/impl/v1/health"
	projectImpl "github.com/perses/perses/internal/api/impl/v1/project"
	prometheusruleImpl "github.com/perses/perses/internal/api/impl/v1/prometheusrule"
	userImpl "github.com/perses/perses/internal/api/impl/v1/user"
	"github.com/perses/perses/internal/api/interface/v1/dashboard"
	"github.com/perses/perses/internal/api/interface/v1/datasource"
	"github.com/perses/perses/internal/api/interface/v1/health"
	"github.com/perses/perses/internal/api/interface/v1/project"
	"github.com/perses/perses/internal/api/interface/v1/prometheusrule"
	"github.com/perses/perses/internal/api/interface/v1/user"
	"github.com/perses/perses/internal/api/shared/database"
	"github.com/perses/perses/internal/config"
)

type PersistenceManager interface {
	GetDashboard() dashboard.DAO
	GetDatasource() datasource.DAO
	GetHealth() health.DAO
	GetProject() project.DAO
	GetPrometheusRule() prometheusrule.DAO
	GetUser() user.DAO
}

type persistence struct {
	PersistenceManager
	dashboard      dashboard.DAO
	datasource     datasource.DAO
	health         health.DAO
	project        project.DAO
	prometheusRule prometheusrule.DAO
	user           user.DAO
}

func NewPersistenceManager(conf config.Database) (PersistenceManager, error) {
	persesDAO, err := database.New(conf)
	if err != nil {
		return nil, err
	}
	dashboardDAO := dashboardImpl.NewDAO(persesDAO)
	datasourceDAO := datasourceImpl.NewDAO(persesDAO)
	healthDAO := healthImpl.NewDAO(persesDAO)
	projectDAO := projectImpl.NewDAO(persesDAO)
	prometheusRuleDAO := prometheusruleImpl.NewDAO(persesDAO)
	userDAO := userImpl.NewDAO(persesDAO)
	return &persistence{
		dashboard:      dashboardDAO,
		datasource:     datasourceDAO,
		health:         healthDAO,
		project:        projectDAO,
		prometheusRule: prometheusRuleDAO,
		user:           userDAO,
	}, nil
}

func (p *persistence) GetDashboard() dashboard.DAO {
	return p.dashboard
}

func (p *persistence) GetDatasource() datasource.DAO {
	return p.datasource
}

func (p *persistence) GetHealth() health.DAO {
	return p.health
}

func (p *persistence) GetProject() project.DAO {
	return p.project
}

func (p *persistence) GetPrometheusRule() prometheusrule.DAO {
	return p.prometheusRule
}

func (p *persistence) GetUser() user.DAO {
	return p.user
}
