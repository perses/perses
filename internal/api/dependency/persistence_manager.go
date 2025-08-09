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
	"github.com/perses/perses/internal/api/database"
	databaseModel "github.com/perses/perses/internal/api/database/model"
	dashboardImpl "github.com/perses/perses/internal/api/impl/v1/dashboard"
	datasourceImpl "github.com/perses/perses/internal/api/impl/v1/datasource"
	ephemeralDashboardImpl "github.com/perses/perses/internal/api/impl/v1/ephemeraldashboard"
	folderImpl "github.com/perses/perses/internal/api/impl/v1/folder"
	globalDatasourceImpl "github.com/perses/perses/internal/api/impl/v1/globaldatasource"
	globalRoleImpl "github.com/perses/perses/internal/api/impl/v1/globalrole"
	globalRoleBindingImpl "github.com/perses/perses/internal/api/impl/v1/globalrolebinding"
	globalSecretImpl "github.com/perses/perses/internal/api/impl/v1/globalsecret"
	globalVariableImpl "github.com/perses/perses/internal/api/impl/v1/globalvariable"
	healthImpl "github.com/perses/perses/internal/api/impl/v1/health"
	projectImpl "github.com/perses/perses/internal/api/impl/v1/project"
	roleImpl "github.com/perses/perses/internal/api/impl/v1/role"
	roleBindingImpl "github.com/perses/perses/internal/api/impl/v1/rolebinding"
	secretImpl "github.com/perses/perses/internal/api/impl/v1/secret"
	userImpl "github.com/perses/perses/internal/api/impl/v1/user"
	variableImpl "github.com/perses/perses/internal/api/impl/v1/variable"
	"github.com/perses/perses/internal/api/interface/v1/dashboard"
	"github.com/perses/perses/internal/api/interface/v1/datasource"
	"github.com/perses/perses/internal/api/interface/v1/ephemeraldashboard"
	"github.com/perses/perses/internal/api/interface/v1/folder"
	"github.com/perses/perses/internal/api/interface/v1/globaldatasource"
	"github.com/perses/perses/internal/api/interface/v1/globalrole"
	"github.com/perses/perses/internal/api/interface/v1/globalrolebinding"
	"github.com/perses/perses/internal/api/interface/v1/globalsecret"
	"github.com/perses/perses/internal/api/interface/v1/globalvariable"
	"github.com/perses/perses/internal/api/interface/v1/health"
	"github.com/perses/perses/internal/api/interface/v1/project"
	"github.com/perses/perses/internal/api/interface/v1/role"
	"github.com/perses/perses/internal/api/interface/v1/rolebinding"
	"github.com/perses/perses/internal/api/interface/v1/secret"
	"github.com/perses/perses/internal/api/interface/v1/user"
	"github.com/perses/perses/internal/api/interface/v1/variable"
	"github.com/perses/perses/pkg/model/api/config"
)

type PersistenceManager interface {
	GetDashboard() dashboard.DAO
	GetDatasource() datasource.DAO
	GetEphemeralDashboard() ephemeraldashboard.DAO
	GetFolder() folder.DAO
	GetGlobalDatasource() globaldatasource.DAO
	GetGlobalRole() globalrole.DAO
	GetGlobalRoleBinding() globalrolebinding.DAO
	GetGlobalSecret() globalsecret.DAO
	GetGlobalVariable() globalvariable.DAO
	GetHealth() health.DAO
	GetPersesDAO() databaseModel.DAO
	GetProject() project.DAO
	GetRole() role.DAO
	GetRoleBinding() rolebinding.DAO
	GetSecret() secret.DAO
	GetUser() user.DAO
	GetVariable() variable.DAO
}

type persistence struct {
	PersistenceManager
	dashboard          dashboard.DAO
	datasource         datasource.DAO
	ephemeralDashboard ephemeraldashboard.DAO
	folder             folder.DAO
	globalDatasource   globaldatasource.DAO
	globalRole         globalrole.DAO
	globalRoleBinding  globalrolebinding.DAO
	globalSecret       globalsecret.DAO
	globalVariable     globalvariable.DAO
	health             health.DAO
	perses             databaseModel.DAO
	project            project.DAO
	role               role.DAO
	roleBinding        rolebinding.DAO
	secret             secret.DAO
	user               user.DAO
	variable           variable.DAO
}

func newPersistenceManager(conf config.Database) (PersistenceManager, error) {
	persesDAO, err := database.New(conf)
	if err != nil {
		return nil, err
	}
	dashboardDAO := dashboardImpl.NewDAO(persesDAO)
	datasourceDAO := datasourceImpl.NewDAO(persesDAO)
	ephemeralDashboardDAO := ephemeralDashboardImpl.NewDAO(persesDAO)
	folderDAO := folderImpl.NewDAO(persesDAO)
	globalDatatasourceDAO := globalDatasourceImpl.NewDAO(persesDAO)
	globalRoleDAO := globalRoleImpl.NewDAO(persesDAO)
	globalRoleBindingDAO := globalRoleBindingImpl.NewDAO(persesDAO)
	globalSecretDAO := globalSecretImpl.NewDAO(persesDAO)
	globalVariableDAO := globalVariableImpl.NewDAO(persesDAO)
	healthDAO := healthImpl.NewDAO(persesDAO)
	projectDAO := projectImpl.NewDAO(persesDAO)
	roleDAO := roleImpl.NewDAO(persesDAO)
	roleBindingDAO := roleBindingImpl.NewDAO(persesDAO)
	secretDAO := secretImpl.NewDAO(persesDAO)
	userDAO := userImpl.NewDAO(persesDAO)
	variableDAO := variableImpl.NewDAO(persesDAO)
	return &persistence{
		dashboard:          dashboardDAO,
		datasource:         datasourceDAO,
		ephemeralDashboard: ephemeralDashboardDAO,
		folder:             folderDAO,
		globalDatasource:   globalDatatasourceDAO,
		globalRole:         globalRoleDAO,
		globalRoleBinding:  globalRoleBindingDAO,
		globalSecret:       globalSecretDAO,
		globalVariable:     globalVariableDAO,
		health:             healthDAO,
		perses:             persesDAO,
		project:            projectDAO,
		role:               roleDAO,
		roleBinding:        roleBindingDAO,
		secret:             secretDAO,
		user:               userDAO,
		variable:           variableDAO,
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

func (p *persistence) GetEphemeralDashboard() ephemeraldashboard.DAO {
	return p.ephemeralDashboard
}

func (p *persistence) GetGlobalDatasource() globaldatasource.DAO {
	return p.globalDatasource
}

func (p *persistence) GetGlobalRole() globalrole.DAO {
	return p.globalRole
}

func (p *persistence) GetGlobalRoleBinding() globalrolebinding.DAO {
	return p.globalRoleBinding
}

func (p *persistence) GetGlobalSecret() globalsecret.DAO {
	return p.globalSecret
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

func (p *persistence) GetRole() role.DAO {
	return p.role
}

func (p *persistence) GetRoleBinding() rolebinding.DAO {
	return p.roleBinding
}

func (p *persistence) GetSecret() secret.DAO {
	return p.secret
}

func (p *persistence) GetUser() user.DAO {
	return p.user
}

func (p *persistence) GetVariable() variable.DAO {
	return p.variable
}
