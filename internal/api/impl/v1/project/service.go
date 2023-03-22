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

package project

import (
	"fmt"

	"github.com/perses/perses/internal/api/interface/v1/dashboard"
	"github.com/perses/perses/internal/api/interface/v1/datasource"
	"github.com/perses/perses/internal/api/interface/v1/folder"
	"github.com/perses/perses/internal/api/interface/v1/project"
	"github.com/perses/perses/internal/api/shared"
	databaseModel "github.com/perses/perses/internal/api/shared/database/model"
	"github.com/perses/perses/pkg/model/api"
	v1 "github.com/perses/perses/pkg/model/api/v1"
	"github.com/sirupsen/logrus"
)

type service struct {
	project.Service
	dao           project.DAO
	folderDAO     folder.DAO
	datasourceDAO datasource.DAO
	dashboardDAO  dashboard.DAO
}

func NewService(dao project.DAO, folderDAO folder.DAO, datasourceDAO datasource.DAO, dashboardDAO dashboard.DAO) project.Service {
	return &service{
		dao:           dao,
		folderDAO:     folderDAO,
		datasourceDAO: datasourceDAO,
		dashboardDAO:  dashboardDAO,
	}
}

func (s *service) Create(entity api.Entity) (interface{}, error) {
	if projectObject, ok := entity.(*v1.Project); ok {
		return s.create(projectObject)
	}
	return nil, fmt.Errorf("%w: wrong entity format, attempting project format, received '%T'", shared.BadRequestError, entity)
}

func (s *service) create(entity *v1.Project) (*v1.Project, error) {
	// Update the time contains in the entity
	entity.Metadata.CreateNow()
	if err := s.dao.Create(entity); err != nil {
		return nil, err
	}
	return entity, nil
}

func (s *service) Update(entity api.Entity, parameters shared.Parameters) (interface{}, error) {
	if projectObject, ok := entity.(*v1.Project); ok {
		return s.update(projectObject, parameters)
	}
	return nil, fmt.Errorf("%w: wrong entity format, attempting project format, received '%T'", shared.BadRequestError, entity)
}

func (s *service) update(entity *v1.Project, parameters shared.Parameters) (*v1.Project, error) {
	if entity.Metadata.Name != parameters.Name {
		logrus.Debugf("name in project %q and name from the http request: %q don't match", entity.Metadata.Name, parameters.Name)
		return nil, fmt.Errorf("%w: metadata.name and the name in the http path request don't match", shared.BadRequestError)
	}
	// find the previous version of the project
	oldEntity, err := s.dao.Get(parameters.Name)
	if err != nil {
		return nil, err
	}
	entity.Metadata.Update(oldEntity.Metadata)
	if updateErr := s.dao.Update(entity); updateErr != nil {
		logrus.WithError(updateErr).Errorf("unable to perform the update of the project %q, something wrong with the database", entity.Metadata.Name)
		return nil, updateErr
	}
	return entity, nil
}

func (s *service) Delete(parameters shared.Parameters) error {
	projectName := parameters.Name
	if err := s.folderDAO.DeleteAll(projectName); err != nil {
		logrus.WithError(err).Error("unable to delete all folders")
		return err
	}
	if err := s.dashboardDAO.DeleteAll(projectName); err != nil {
		logrus.WithError(err).Error("unable to delete all dashboards")
		return err
	}
	if err := s.datasourceDAO.DeleteAll(projectName); err != nil {
		logrus.WithError(err).Error("unable to delete all datasources")
		return err
	}
	return s.dao.Delete(parameters.Name)
}

func (s *service) Get(parameters shared.Parameters) (interface{}, error) {
	return s.dao.Get(parameters.Name)
}

func (s *service) List(q databaseModel.Query, _ shared.Parameters) (interface{}, error) {
	return s.dao.List(q)
}
