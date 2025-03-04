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

// Package dependency provides different manager that will be used to instantiate the different services and daos of the API.
// It's one way to inject the different dependencies into the different services/daos.
package dependency

import (
	"github.com/perses/perses/internal/api/crypto"
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
	viewImpl "github.com/perses/perses/internal/api/impl/v1/view"
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
	"github.com/perses/perses/internal/api/interface/v1/view"
	"github.com/perses/perses/internal/api/plugin"
	"github.com/perses/perses/internal/api/plugin/migrate"
	"github.com/perses/perses/internal/api/plugin/schema"
	"github.com/perses/perses/internal/api/rbac"
	"github.com/perses/perses/pkg/model/api/config"
)

type ServiceManager interface {
	GetCrypto() crypto.Crypto
	GetDashboard() dashboard.Service
	GetDatasource() datasource.Service
	GetEphemeralDashboard() ephemeraldashboard.Service
	GetFolder() folder.Service
	GetGlobalDatasource() globaldatasource.Service
	GetGlobalRole() globalrole.Service
	GetGlobalRoleBinding() globalrolebinding.Service
	GetGlobalSecret() globalsecret.Service
	GetGlobalVariable() globalvariable.Service
	GetHealth() health.Service
	GetJWT() crypto.JWT
	GetMigration() migrate.Migration
	GetPlugin() plugin.Plugin
	GetProject() project.Service
	GetSchema() schema.Schema
	GetRBAC() rbac.RBAC
	GetRole() role.Service
	GetRoleBinding() rolebinding.Service
	GetSecret() secret.Service
	GetUser() user.Service
	GetVariable() variable.Service
	GetView() view.Service
}

type service struct {
	ServiceManager
	crypto             crypto.Crypto
	dashboard          dashboard.Service
	datasource         datasource.Service
	ephemeralDashboard ephemeraldashboard.Service
	folder             folder.Service
	globalDatasource   globaldatasource.Service
	globalRole         globalrole.Service
	globalRoleBinding  globalrolebinding.Service
	globalSecret       globalsecret.Service
	globalVariable     globalvariable.Service
	health             health.Service
	jwt                crypto.JWT
	migrate            migrate.Migration
	plugin             plugin.Plugin
	project            project.Service
	schema             schema.Schema
	rbac               rbac.RBAC
	role               role.Service
	roleBinding        rolebinding.Service
	secret             secret.Service
	user               user.Service
	variable           variable.Service
	view               view.Service
}

func NewServiceManager(dao PersistenceManager, conf config.Config) (ServiceManager, error) {
	cryptoService, jwtService, err := crypto.New(conf.Security)
	if err != nil {
		return nil, err
	}
	rbacService, err := rbac.New(dao.GetUser(), dao.GetRole(), dao.GetRoleBinding(), dao.GetGlobalRole(), dao.GetGlobalRoleBinding(), conf)
	if err != nil {
		return nil, err
	}
	pluginService := plugin.New(conf.Plugin)
	schemaService := pluginService.Schema()
	migrateService := pluginService.Migration()
	dashboardService := dashboardImpl.NewService(conf, dao.GetDashboard(), dao.GetGlobalVariable(), dao.GetVariable(), schemaService)
	datasourceService := datasourceImpl.NewService(dao.GetDatasource(), schemaService)
	ephemeralDashboardService := ephemeralDashboardImpl.NewService(dao.GetEphemeralDashboard(), dao.GetGlobalVariable(), dao.GetVariable(), schemaService)
	folderService := folderImpl.NewService(dao.GetFolder())
	variableService := variableImpl.NewService(dao.GetVariable(), schemaService)
	globalDatasourceService := globalDatasourceImpl.NewService(dao.GetGlobalDatasource(), schemaService)
	globalRole := globalRoleImpl.NewService(dao.GetGlobalRole(), rbacService, schemaService)
	globalRoleBinding := globalRoleBindingImpl.NewService(dao.GetGlobalRoleBinding(), dao.GetGlobalRole(), dao.GetUser(), rbacService, schemaService)
	globalSecret := globalSecretImpl.NewService(dao.GetGlobalSecret(), cryptoService)
	globalVariableService := globalVariableImpl.NewService(dao.GetGlobalVariable(), schemaService)
	healthService := healthImpl.NewService(dao.GetHealth())
	projectService := projectImpl.NewService(dao.GetProject(), dao.GetFolder(), dao.GetDatasource(), dao.GetDashboard(), dao.GetRole(), dao.GetRoleBinding(), dao.GetSecret(), dao.GetVariable(), rbacService)
	roleService := roleImpl.NewService(dao.GetRole(), rbacService, schemaService)
	roleBindingService := roleBindingImpl.NewService(dao.GetRoleBinding(), dao.GetRole(), dao.GetUser(), rbacService, schemaService)
	secretService := secretImpl.NewService(dao.GetSecret(), cryptoService)
	userService := userImpl.NewService(dao.GetUser(), rbacService)
	viewService := viewImpl.NewMetricsViewService()

	svc := &service{
		crypto:             cryptoService,
		dashboard:          dashboardService,
		datasource:         datasourceService,
		ephemeralDashboard: ephemeralDashboardService,
		folder:             folderService,
		globalDatasource:   globalDatasourceService,
		globalRole:         globalRole,
		globalRoleBinding:  globalRoleBinding,
		globalSecret:       globalSecret,
		globalVariable:     globalVariableService,
		health:             healthService,
		jwt:                jwtService,
		migrate:            migrateService,
		plugin:             pluginService,
		project:            projectService,
		rbac:               rbacService,
		role:               roleService,
		roleBinding:        roleBindingService,
		schema:             schemaService,
		secret:             secretService,
		user:               userService,
		variable:           variableService,
		view:               viewService,
	}
	return svc, nil
}

func (s *service) GetCrypto() crypto.Crypto {
	return s.crypto
}

func (s *service) GetDashboard() dashboard.Service {
	return s.dashboard
}

func (s *service) GetDatasource() datasource.Service {
	return s.datasource
}

func (s *service) GetEphemeralDashboard() ephemeraldashboard.Service {
	return s.ephemeralDashboard
}

func (s *service) GetFolder() folder.Service {
	return s.folder
}

func (s *service) GetGlobalDatasource() globaldatasource.Service {
	return s.globalDatasource
}

func (s *service) GetGlobalRole() globalrole.Service {
	return s.globalRole
}

func (s *service) GetGlobalRoleBinding() globalrolebinding.Service {
	return s.globalRoleBinding
}

func (s *service) GetGlobalSecret() globalsecret.Service {
	return s.globalSecret
}

func (s *service) GetGlobalVariable() globalvariable.Service {
	return s.globalVariable
}

func (s *service) GetHealth() health.Service {
	return s.health
}

func (s *service) GetJWT() crypto.JWT {
	return s.jwt
}

func (s *service) GetMigration() migrate.Migration {
	return s.migrate
}

func (s *service) GetPlugin() plugin.Plugin {
	return s.plugin
}

func (s *service) GetProject() project.Service {
	return s.project
}

func (s *service) GetSchema() schema.Schema {
	return s.schema
}

func (s *service) GetRBAC() rbac.RBAC {
	return s.rbac
}

func (s *service) GetRole() role.Service {
	return s.role
}

func (s *service) GetRoleBinding() rolebinding.Service {
	return s.roleBinding
}

func (s *service) GetSecret() secret.Service {
	return s.secret
}

func (s *service) GetUser() user.Service {
	return s.user
}

func (s *service) GetVariable() variable.Service {
	return s.variable
}

func (s *service) GetView() view.Service {
	return s.view
}
