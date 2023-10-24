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

// Package dependency provides different manager that will be used to instantiate the different services and daos of the API.
// It's one way to inject the different dependencies into the different services/daos.
package dependency

import (
	"github.com/perses/common/async"
	"github.com/perses/perses/internal/api/config"
	dashboardImpl "github.com/perses/perses/internal/api/impl/v1/dashboard"
	datasourceImpl "github.com/perses/perses/internal/api/impl/v1/datasource"
	folderImpl "github.com/perses/perses/internal/api/impl/v1/folder"
	globalDatasourceImpl "github.com/perses/perses/internal/api/impl/v1/globaldatasource"
	globalSecretImpl "github.com/perses/perses/internal/api/impl/v1/globalsecret"
	globalVariableImpl "github.com/perses/perses/internal/api/impl/v1/globalvariable"
	healthImpl "github.com/perses/perses/internal/api/impl/v1/health"
	projectImpl "github.com/perses/perses/internal/api/impl/v1/project"
	secretImpl "github.com/perses/perses/internal/api/impl/v1/secret"
	userImpl "github.com/perses/perses/internal/api/impl/v1/user"
	variableImpl "github.com/perses/perses/internal/api/impl/v1/variable"
	"github.com/perses/perses/internal/api/interface/v1/dashboard"
	"github.com/perses/perses/internal/api/interface/v1/datasource"
	"github.com/perses/perses/internal/api/interface/v1/folder"
	"github.com/perses/perses/internal/api/interface/v1/globaldatasource"
	"github.com/perses/perses/internal/api/interface/v1/globalsecret"
	"github.com/perses/perses/internal/api/interface/v1/globalvariable"
	"github.com/perses/perses/internal/api/interface/v1/health"
	"github.com/perses/perses/internal/api/interface/v1/project"
	"github.com/perses/perses/internal/api/interface/v1/secret"
	"github.com/perses/perses/internal/api/interface/v1/user"
	"github.com/perses/perses/internal/api/interface/v1/variable"
	"github.com/perses/perses/internal/api/shared/crypto"
	"github.com/perses/perses/internal/api/shared/migrate"
	"github.com/perses/perses/internal/api/shared/schemas"
)

type ServiceManager interface {
	GetCrypto() crypto.Crypto
	GetDashboard() dashboard.Service
	GetDatasource() datasource.Service
	GetFolder() folder.Service
	GetGlobalDatasource() globaldatasource.Service
	GetGlobalSecret() globalsecret.Service
	GetGlobalVariable() globalvariable.Service
	GetHealth() health.Service
	GetJWT() crypto.JWT
	GetMigration() migrate.Migration
	GetProject() project.Service
	GetProvisioning() async.SimpleTask
	GetSchemas() schemas.Schemas
	GetSecret() secret.Service
	GetUser() user.Service
	GetVariable() variable.Service
}

type service struct {
	ServiceManager
	crypto           crypto.Crypto
	dashboard        dashboard.Service
	datasource       datasource.Service
	folder           folder.Service
	globalDatasource globaldatasource.Service
	globalSecret     globalsecret.Service
	globalVariable   globalvariable.Service
	health           health.Service
	jwt              crypto.JWT
	migrate          migrate.Migration
	project          project.Service
	provisioning     async.SimpleTask
	schemas          schemas.Schemas
	secret           secret.Service
	user             user.Service
	variable         variable.Service
}

func NewServiceManager(dao PersistenceManager, conf config.Config) (ServiceManager, error) {
	cryptoService, jwtService, err := crypto.New(string(conf.EncryptionKey))
	if err != nil {
		return nil, err
	}
	schemasService, err := schemas.New(conf.Schemas)
	if err != nil {
		return nil, err
	}
	migrateService, err := migrate.New(conf.Schemas)
	if err != nil {
		return nil, err
	}
	dashboardService := dashboardImpl.NewService(dao.GetDashboard(), schemasService, dao.GetGlobalVariable(), dao.GetVariable())
	datasourceService := datasourceImpl.NewService(dao.GetDatasource(), schemasService)
	folderService := folderImpl.NewService(dao.GetFolder())
	variableService := variableImpl.NewService(dao.GetVariable(), schemasService)
	globalDatasourceService := globalDatasourceImpl.NewService(dao.GetGlobalDatasource(), schemasService)
	globalSecret := globalSecretImpl.NewService(dao.GetGlobalSecret(), cryptoService)
	globalVariableService := globalVariableImpl.NewService(dao.GetGlobalVariable(), schemasService)
	healthService := healthImpl.NewService(dao.GetHealth())
	projectService := projectImpl.NewService(dao.GetProject(), dao.GetFolder(), dao.GetDatasource(), dao.GetDashboard(), dao.GetSecret(), dao.GetVariable())
	secretService := secretImpl.NewService(dao.GetSecret(), cryptoService)
	userService := userImpl.NewService(dao.GetUser())
	svc := &service{
		crypto:           cryptoService,
		dashboard:        dashboardService,
		datasource:       datasourceService,
		folder:           folderService,
		globalDatasource: globalDatasourceService,
		globalSecret:     globalSecret,
		globalVariable:   globalVariableService,
		health:           healthService,
		jwt:              jwtService,
		migrate:          migrateService,
		project:          projectService,
		schemas:          schemasService,
		secret:           secretService,
		user:             userService,
		variable:         variableService,
	}
	provisioningService := &provisioning{
		serviceManager: svc,
		folders:        conf.Provisioning.Folders,
	}
	svc.provisioning = provisioningService
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

func (s *service) GetFolder() folder.Service {
	return s.folder
}

func (s *service) GetGlobalDatasource() globaldatasource.Service {
	return s.globalDatasource
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

func (s *service) GetProject() project.Service {
	return s.project
}

func (s *service) GetProvisioning() async.SimpleTask {
	return s.provisioning
}

func (s *service) GetSchemas() schemas.Schemas {
	return s.schemas
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
