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
	dashboardImpl "github.com/perses/perses/internal/api/impl/v1/dashboard"
	datasourceImpl "github.com/perses/perses/internal/api/impl/v1/datasource"
	folderImpl "github.com/perses/perses/internal/api/impl/v1/folder"
	globalDatasourceImpl "github.com/perses/perses/internal/api/impl/v1/globaldatasource"
	healthImpl "github.com/perses/perses/internal/api/impl/v1/health"
	projectImpl "github.com/perses/perses/internal/api/impl/v1/project"
	userImpl "github.com/perses/perses/internal/api/impl/v1/user"
	"github.com/perses/perses/internal/api/interface/v1/dashboard"
	"github.com/perses/perses/internal/api/interface/v1/datasource"
	"github.com/perses/perses/internal/api/interface/v1/folder"
	"github.com/perses/perses/internal/api/interface/v1/globaldatasource"
	"github.com/perses/perses/internal/api/interface/v1/health"
	"github.com/perses/perses/internal/api/interface/v1/project"
	"github.com/perses/perses/internal/api/interface/v1/user"
	"github.com/perses/perses/internal/config"
)

type ServiceManager interface {
	GetDashboard() dashboard.Service
	GetDatasource() datasource.Service
	GetFolder() folder.Service
	GetGlobalDatasource() globaldatasource.Service
	GetHealth() health.Service
	GetProject() project.Service
	GetUser() user.Service
}

type service struct {
	ServiceManager
	dashboard        dashboard.Service
	datasource       datasource.Service
	folder           folder.Service
	globalDatasource globaldatasource.Service
	health           health.Service
	project          project.Service
	user             user.Service
}

func NewServiceManager(dao PersistenceManager, conf config.Config) ServiceManager {
	dashboardService := dashboardImpl.NewService(dao.GetDashboard(), conf)
	datasourceService := datasourceImpl.NewService(dao.GetDatasource())
	folderService := folderImpl.NewService(dao.GetFolder())
	globalDatasourceService := globalDatasourceImpl.NewService(dao.GetGlobalDatasource())
	healthService := healthImpl.NewService(dao.GetHealth())
	projectService := projectImpl.NewService(dao.GetProject())
	userService := userImpl.NewService(dao.GetUser())
	return &service{
		dashboard:        dashboardService,
		datasource:       datasourceService,
		folder:           folderService,
		globalDatasource: globalDatasourceService,
		health:           healthService,
		project:          projectService,
		user:             userService,
	}
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

func (s *service) GetHealth() health.Service {
	return s.health
}

func (s *service) GetProject() project.Service {
	return s.project
}

func (s *service) GetUser() user.Service {
	return s.user
}
