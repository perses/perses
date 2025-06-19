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
	"encoding/json"
	"fmt"

	"github.com/brunoga/deep"
	"github.com/labstack/echo/v4"
	"github.com/perses/perses/internal/api/authorization"
	apiInterface "github.com/perses/perses/internal/api/interface"
	"github.com/perses/perses/internal/api/interface/v1/dashboard"
	"github.com/perses/perses/internal/api/interface/v1/datasource"
	"github.com/perses/perses/internal/api/interface/v1/folder"
	"github.com/perses/perses/internal/api/interface/v1/project"
	"github.com/perses/perses/internal/api/interface/v1/role"
	"github.com/perses/perses/internal/api/interface/v1/rolebinding"
	"github.com/perses/perses/internal/api/interface/v1/secret"
	"github.com/perses/perses/internal/api/interface/v1/variable"
	"github.com/perses/perses/pkg/model/api"
	v1 "github.com/perses/perses/pkg/model/api/v1"
	"github.com/perses/perses/pkg/model/api/v1/utils"
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
	authz          authorization.Authorization
}

func NewService(dao project.DAO, folderDAO folder.DAO, datasourceDAO datasource.DAO, dashboardDAO dashboard.DAO, roleDAO role.DAO, roleBindingDAO rolebinding.DAO, secretDAO secret.DAO, variableDAO variable.DAO, authz authorization.Authorization) project.Service {
	return &service{
		dao:            dao,
		folderDAO:      folderDAO,
		datasourceDAO:  datasourceDAO,
		dashboardDAO:   dashboardDAO,
		roleDAO:        roleDAO,
		roleBindingDAO: roleBindingDAO,
		secretDAO:      secretDAO,
		variableDAO:    variableDAO,
		authz:          authz,
	}
}

func (s *service) Create(ctx echo.Context, entity *v1.Project) (*v1.Project, error) {
	copyEntity, err := deep.Copy(entity)
	if err != nil {
		return nil, fmt.Errorf("failed to copy entity: %w", err)
	}
	return s.create(ctx, copyEntity)
}

func (s *service) create(ctx echo.Context, entity *v1.Project) (*v1.Project, error) {
	// Update the time contains in the entity
	entity.Metadata.CreateNow()
	if err := s.dao.Create(entity); err != nil {
		return nil, err
	}

	// If authorization is enabled, permissions to the creator need to be given
	if s.authz.IsEnabled() {
		if err := s.createProjectRoleAndRoleBinding(ctx, entity.Metadata.Name); err != nil {
			return nil, err
		}
	}
	return entity, nil
}

// Create default roles and role bindings for the project
func (s *service) createProjectRoleAndRoleBinding(ctx echo.Context, projectName string) error {
	owner := utils.DefaultOwnerRole(projectName)
	editor := utils.DefaultEditorRole(projectName)
	viewer := utils.DefaultViewerRole(projectName)

	if err := s.roleDAO.Create(owner); err != nil {
		return fmt.Errorf("failed to create owner role: %e", err)
	}
	if err := s.roleDAO.Create(editor); err != nil {
		return fmt.Errorf("failed to create editor role: %e", err)
	}
	if err := s.roleDAO.Create(viewer); err != nil {
		return fmt.Errorf("failed to create viewer role: %e", err)
	}
	username, err := s.authz.GetUsername(ctx)
	if err != nil {
		return fmt.Errorf("failed to get username from context: %e", err)
	}
	if len(username) > 0 {
		ownerRb := utils.DefaultOwnerRoleBinding(projectName, username)
		if err := s.roleBindingDAO.Create(ownerRb); err != nil {
			return fmt.Errorf("failed to create owner role binding: %e", err)
		}
	}
	return s.authz.RefreshPermissions()
}

func (s *service) Update(_ echo.Context, entity *v1.Project, parameters apiInterface.Parameters) (*v1.Project, error) {
	copyEntity, err := deep.Copy(entity)
	if err != nil {
		return nil, fmt.Errorf("failed to copy entity: %w", err)
	}
	return s.update(copyEntity, parameters)
}

func (s *service) update(entity *v1.Project, parameters apiInterface.Parameters) (*v1.Project, error) {
	if entity.Metadata.Name != parameters.Name {
		logrus.Debugf("name in project %q and name from the http request: %q don't match", entity.Metadata.Name, parameters.Name)
		return nil, apiInterface.HandleBadRequestError("metadata.name and the name in the http path request don't match")
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

func (s *service) Delete(_ echo.Context, parameters apiInterface.Parameters) error {
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
	if s.authz.IsEnabled() {
		if err := s.authz.RefreshPermissions(); err != nil {
			return err
		}
	}
	return s.dao.Delete(parameters.Name)
}

func (s *service) Get(parameters apiInterface.Parameters) (*v1.Project, error) {
	return s.dao.Get(parameters.Name)
}

func (s *service) List(q *project.Query, _ apiInterface.Parameters) ([]*v1.Project, error) {
	return s.dao.List(q)
}

func (s *service) RawList(q *project.Query, _ apiInterface.Parameters) ([]json.RawMessage, error) {
	return s.dao.RawList(q)
}

func (s *service) MetadataList(q *project.Query, _ apiInterface.Parameters) ([]api.Entity, error) {
	return s.dao.MetadataList(q)
}

func (s *service) RawMetadataList(q *project.Query, _ apiInterface.Parameters) ([]json.RawMessage, error) {
	return s.dao.RawMetadataList(q)
}
