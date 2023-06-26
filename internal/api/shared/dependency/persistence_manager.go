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

package dependency

import (
	"github.com/perses/perses/internal/api/config"
	dashboardImpl "github.com/perses/perses/internal/api/impl/v1/dashboard"
	datasourceImpl "github.com/perses/perses/internal/api/impl/v1/datasource"
	folderImpl "github.com/perses/perses/internal/api/impl/v1/folder"
	globalDatasourceImpl "github.com/perses/perses/internal/api/impl/v1/globaldatasource"
	globalVariableImpl "github.com/perses/perses/internal/api/impl/v1/globalvariable"
	healthImpl "github.com/perses/perses/internal/api/impl/v1/health"
	projectImpl "github.com/perses/perses/internal/api/impl/v1/project"
	variableImpl "github.com/perses/perses/internal/api/impl/v1/variable"
	"github.com/perses/perses/internal/api/interface/v1/dashboard"
	"github.com/perses/perses/internal/api/interface/v1/datasource"
	"github.com/perses/perses/internal/api/interface/v1/folder"
	"github.com/perses/perses/internal/api/interface/v1/globaldatasource"
	"github.com/perses/perses/internal/api/interface/v1/globalvariable"
	"github.com/perses/perses/internal/api/interface/v1/health"
	"github.com/perses/perses/internal/api/interface/v1/project"
	"github.com/perses/perses/internal/api/interface/v1/variable"
	"github.com/perses/perses/internal/api/shared/database"
	databaseModel "github.com/perses/perses/internal/api/shared/database/model"
)

type PersistenceManager interface {
	GetDashboard() dashboard.DAO
	GetDatasource() datasource.DAO
	GetFolder() folder.DAO
	GetGlobalDatasource() globaldatasource.DAO
	GetGlobalVariable() globalvariable.DAO
	GetHealth() health.DAO
	GetPersesDAO() databaseModel.DAO
	GetProject() project.DAO
	GetVariable() variable.DAO
}

type persistence struct {
	PersistenceManager
	dashboard        dashboard.DAO
	datasource       datasource.DAO
	folder           folder.DAO
	globalDatasource globaldatasource.DAO
	globalVariable   globalvariable.DAO
	health           health.DAO
	perses           databaseModel.DAO
	project          project.DAO
	variable         variable.DAO
}

func NewPersistenceManager(conf config.Database) (PersistenceManager, error) {
	persesDAO, err := database.New(conf)
	if err != nil {
		return nil, err
	}
	dashboardDAO := dashboardImpl.NewDAO(persesDAO)
	datasourceDAO := datasourceImpl.NewDAO(persesDAO)
	folderDAO := folderImpl.NewDAO(persesDAO)
	globalDatatasourceDAO := globalDatasourceImpl.NewDAO(persesDAO)
	globalVariableDAO := globalVariableImpl.NewDAO(persesDAO)
	healthDAO := healthImpl.NewDAO(persesDAO)
	projectDAO := projectImpl.NewDAO(persesDAO)
	variableDAO := variableImpl.NewDAO(persesDAO)
	return &persistence{
		dashboard:        dashboardDAO,
		datasource:       datasourceDAO,
		folder:           folderDAO,
		globalDatasource: globalDatatasourceDAO,
		globalVariable:   globalVariableDAO,
		health:           healthDAO,
		perses:           persesDAO,
		project:          projectDAO,
		variable:         variableDAO,
	}, nil
}

func (p *persistence) GetDashboard() dashboard.DAO {
	return p.dashboard
}

func (p *persistence) GetDatasource() datasource.DAO {
	return p.datasource
}

func (p *persistence) GetFolder() folder.DAO {
	return p.folder
}

func (p *persistence) GetGlobalDatasource() globaldatasource.DAO {
	return p.globalDatasource
}

func (p *persistence) GetGlobalVariable() globalvariable.DAO {
	return p.globalVariable
}

func (p *persistence) GetHealth() health.DAO {
	return p.health
}

func (p *persistence) GetPersesDAO() databaseModel.DAO {
	return p.perses
}

func (p *persistence) GetProject() project.DAO {
	return p.project
}

func (p *persistence) GetVariable() variable.DAO {
	return p.variable
}
