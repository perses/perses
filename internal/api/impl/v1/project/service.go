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

	apiInterface "github.com/perses/perses/internal/api/interface"
	"github.com/perses/perses/pkg/model/api/v1/utils"

	"github.com/perses/perses/internal/api/interface/v1/dashboard"
	"github.com/perses/perses/internal/api/interface/v1/datasource"
	"github.com/perses/perses/internal/api/interface/v1/folder"
	"github.com/perses/perses/internal/api/interface/v1/project"
	"github.com/perses/perses/internal/api/interface/v1/role"
	"github.com/perses/perses/internal/api/interface/v1/rolebinding"
	"github.com/perses/perses/internal/api/interface/v1/secret"
	"github.com/perses/perses/internal/api/interface/v1/variable"
	"github.com/perses/perses/internal/api/shared"
	"github.com/perses/perses/internal/api/shared/authorization"
	databaseModel "github.com/perses/perses/internal/api/shared/database/model"
	"github.com/perses/perses/pkg/model/api"
	v1 "github.com/perses/perses/pkg/model/api/v1"
	"github.com/sirupsen/logrus"
)

type service struct {
	project.Service
	dao            project.DAO
	folderDAO      folder.DAO
	datasourceDAO  datasource.DAO
	dashboardDAO   dashboard.DAO
	roleDAO        role.DAO
	roleBindingDAO rolebinding.DAO
	secretDAO      secret.DAO
	variableDAO    variable.DAO
	rbac           authorization.RBAC
}

func NewService(dao project.DAO, folderDAO folder.DAO, datasourceDAO datasource.DAO, dashboardDAO dashboard.DAO, roleDAO role.DAO, roleBindingDAO rolebinding.DAO, secretDAO secret.DAO, variableDAO variable.DAO, rbac authorization.RBAC) project.Service {
	return &service{
		dao:            dao,
		folderDAO:      folderDAO,
		datasourceDAO:  datasourceDAO,
		dashboardDAO:   dashboardDAO,
		roleDAO:        roleDAO,
		roleBindingDAO: roleBindingDAO,
		secretDAO:      secretDAO,
		variableDAO:    variableDAO,
		rbac:           rbac,
	}
}

func (s *service) Create(ctx apiInterface.PersesContext, entity api.Entity) (interface{}, error) {
	if object, ok := entity.(*v1.Project); ok {
		return s.create(object, ctx)
	}
	return nil, shared.HandleBadRequestError(fmt.Sprintf("wrong entity format, attempting project format, received '%T'", entity))
}

// Create default roles and role bindings for the project
func (s *service) createProjectRoleAndRoleBinding(projectName string, ctx apiInterface.PersesContext) error {
	owner := utils.DefaultOwnerRole(projectName)
	editor := utils.DefaultEditorRole(projectName)
	viewer := utils.DefaultViewerRole(projectName)

	if err := s.roleDAO.Create(&owner); err != nil {
		return fmt.Errorf("failed to create owner role: %e", err)
	}
	if err := s.roleDAO.Create(&editor); err != nil {
		return fmt.Errorf("failed to create editor role: %e", err)
	}
	if err := s.roleDAO.Create(&viewer); err != nil {
		return fmt.Errorf("failed to create viewer role: %e", err)
	}
	if len(ctx.GetUsername()) > 0 {
		ownerRb := utils.DefaultOwnerRoleBinding(projectName, ctx.GetUsername())
		if err := s.roleBindingDAO.Create(&ownerRb); err != nil {
			return fmt.Errorf("failed to create owner role binding: %e", err)
		}
	}
	return s.rbac.Refresh()
}

func (s *service) create(entity *v1.Project, ctx apiInterface.PersesContext) (*v1.Project, error) {
	// Update the time contains in the entity
	entity.Metadata.CreateNow()
	if err := s.dao.Create(entity); err != nil {
		return nil, err
	}

	// If authorization is enabled, permissions to the creator need to be given
	if s.rbac.IsEnabled() {
		if err := s.createProjectRoleAndRoleBinding(entity.Metadata.Name, ctx); err != nil {
			return nil, err
		}
	}
	return entity, nil
}

func (s *service) Update(_ apiInterface.PersesContext, entity api.Entity, parameters apiInterface.Parameters) (interface{}, error) {
	if object, ok := entity.(*v1.Project); ok {
		return s.update(object, parameters)
	}
	return nil, shared.HandleBadRequestError(fmt.Sprintf("wrong entity format, attempting project format, received '%T'", entity))
}

func (s *service) update(entity *v1.Project, parameters apiInterface.Parameters) (*v1.Project, error) {
	if entity.Metadata.Name != parameters.Name {
		logrus.Debugf("name in project %q and name from the http request: %q don't match", entity.Metadata.Name, parameters.Name)
		return nil, shared.HandleBadRequestError("metadata.name and the name in the http path request don't match")
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

func (s *service) Delete(_ apiInterface.PersesContext, parameters apiInterface.Parameters) error {
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
	if err := s.secretDAO.DeleteAll(projectName); err != nil {
		logrus.WithError(err).Error("unable to delete all secrets")
		return err
	}
	if err := s.variableDAO.DeleteAll(projectName); err != nil {
		logrus.WithError(err).Error("unable to delete all variables")
		return err
	}
	if err := s.roleBindingDAO.DeleteAll(projectName); err != nil {
		logrus.WithError(err).Error("unable to delete all roleBindings")
		return err
	}
	if err := s.roleDAO.DeleteAll(projectName); err != nil {
		logrus.WithError(err).Error("unable to delete all roles")
		return err
	}
	if s.rbac.IsEnabled() {
		if err := s.rbac.Refresh(); err != nil {
			return err
		}
	}
	return s.dao.Delete(parameters.Name)
}

func (s *service) Get(_ apiInterface.PersesContext, parameters apiInterface.Parameters) (interface{}, error) {
	return s.dao.Get(parameters.Name)
}

func (s *service) List(_ apiInterface.PersesContext, q databaseModel.Query, _ apiInterface.Parameters) (interface{}, error) {
	return s.dao.List(q)
}
