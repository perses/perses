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
	"github.com/perses/perses/internal/api/interface/v1/role"
	"github.com/perses/perses/internal/api/interface/v1/rolebinding"
	"github.com/perses/perses/internal/api/shared/authorization"
	"github.com/perses/perses/internal/api/shared/crypto"

	"github.com/perses/perses/internal/api/interface/v1/dashboard"
	"github.com/perses/perses/internal/api/interface/v1/datasource"
	"github.com/perses/perses/internal/api/interface/v1/folder"
	"github.com/perses/perses/internal/api/interface/v1/project"
	"github.com/perses/perses/internal/api/interface/v1/secret"
	"github.com/perses/perses/internal/api/interface/v1/variable"
	"github.com/perses/perses/internal/api/shared"
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

func (s *service) Create(entity api.Entity, claims *crypto.JWTCustomClaims) (interface{}, error) {
	if err := authorization.CheckUserPermission(s.rbac, claims, v1.CreateAction, v1.GlobalProject, v1.KindProject); err != nil {
		return nil, shared.HandleUnauthorizedError(err.Error())
	}
	if object, ok := entity.(*v1.Project); ok {
		return s.create(object, claims)
	}
	return nil, shared.HandleBadRequestError(fmt.Sprintf("wrong entity format, attempting project format, received '%T'", entity))
}

func (s *service) createProjectRoleAndRoleBinding(projectName string, userName string) error {
	if len(userName) == 0 {
		return fmt.Errorf("user empty")
	}

	ownerRole := v1.Role{
		Kind: v1.KindRole,
		Metadata: v1.ProjectMetadata{
			Metadata: v1.Metadata{
				Name: "owner",
			},
			Project: projectName,
		},
		Spec: v1.RoleSpec{
			Permissions: []v1.Permission{
				{
					Actions: []v1.ActionKind{v1.CreateAction, v1.ReadAction, v1.UpdateAction, v1.DeleteAction},
					Scopes:  []v1.Kind{v1.KindDashboard, v1.KindDatasource, v1.KindFolder, v1.KindRole, v1.KindRoleBinding, v1.KindSecret, v1.KindVariable},
				},
			},
		},
	}

	editorRole := v1.Role{
		Kind: v1.KindRole,
		Metadata: v1.ProjectMetadata{
			Metadata: v1.Metadata{
				Name: "editor",
			},
			Project: projectName,
		},
		Spec: v1.RoleSpec{
			Permissions: []v1.Permission{
				{
					Actions: []v1.ActionKind{v1.CreateAction, v1.ReadAction, v1.UpdateAction, v1.DeleteAction},
					Scopes:  []v1.Kind{v1.KindDashboard, v1.KindDatasource, v1.KindFolder, v1.KindSecret, v1.KindVariable},
				},
				{
					Actions: []v1.ActionKind{v1.ReadAction},
					Scopes:  []v1.Kind{v1.KindRole, v1.KindRoleBinding},
				},
			},
		},
	}

	viewerRole := v1.Role{
		Kind: v1.KindRole,
		Metadata: v1.ProjectMetadata{
			Metadata: v1.Metadata{
				Name: "viewer",
			},
			Project: projectName,
		},
		Spec: v1.RoleSpec{
			Permissions: []v1.Permission{
				{
					Actions: []v1.ActionKind{v1.ReadAction},
					Scopes:  []v1.Kind{v1.KindDashboard, v1.KindDatasource, v1.KindFolder, v1.KindRole, v1.KindRoleBinding, v1.KindSecret, v1.KindVariable},
				},
			},
		},
	}

	ownerRoleBinding := v1.RoleBinding{
		Kind: v1.KindRoleBinding,
		Metadata: v1.ProjectMetadata{
			Metadata: v1.Metadata{
				Name: "owner",
			},
			Project: projectName,
		},
		Spec: v1.RoleBindingSpec{
			Role: "owner",
			Subjects: []v1.Subject{
				{
					Kind: v1.KindUser,
					Name: userName,
				},
			},
		},
	}

	if err := s.roleDAO.Create(&ownerRole); err != nil {
		return err
	}
	if err := s.roleDAO.Create(&editorRole); err != nil {
		return err
	}
	if err := s.roleDAO.Create(&viewerRole); err != nil {
		return err
	}
	if err := s.roleBindingDAO.Create(&ownerRoleBinding); err != nil {
		return err
	}
	if err := s.rbac.Refresh(); err != nil {
		return err
	}
	return nil
}

func (s *service) create(entity *v1.Project, claims *crypto.JWTCustomClaims) (*v1.Project, error) {
	// Update the time contains in the entity
	entity.Metadata.CreateNow()
	if err := s.dao.Create(entity); err != nil {
		return nil, err
	}
	if s.rbac.IsEnabled() {
		if err := s.createProjectRoleAndRoleBinding(entity.Metadata.Name, claims.Subject); err != nil { // TODO: retrieve user from claims
			return nil, err
		}
	}
	return entity, nil
}

func (s *service) Update(entity api.Entity, parameters shared.Parameters, claims *crypto.JWTCustomClaims) (interface{}, error) {
	if err := authorization.CheckUserPermission(s.rbac, claims, v1.UpdateAction, v1.GlobalProject, v1.KindProject); err != nil {
		return nil, shared.HandleUnauthorizedError(err.Error())
	}
	if object, ok := entity.(*v1.Project); ok {
		return s.update(object, parameters)
	}
	return nil, shared.HandleBadRequestError(fmt.Sprintf("wrong entity format, attempting project format, received '%T'", entity))
}

func (s *service) update(entity *v1.Project, parameters shared.Parameters) (*v1.Project, error) {
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

func (s *service) Delete(parameters shared.Parameters, claims *crypto.JWTCustomClaims) error {
	if err := authorization.CheckUserPermission(s.rbac, claims, v1.DeleteAction, v1.GlobalProject, v1.KindProject); err != nil {
		return shared.HandleUnauthorizedError(err.Error())
	}
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

func (s *service) Get(parameters shared.Parameters, claims *crypto.JWTCustomClaims) (interface{}, error) {
	if err := authorization.CheckUserPermission(s.rbac, claims, v1.ReadAction, v1.GlobalProject, v1.KindProject); err != nil {
		return nil, shared.HandleUnauthorizedError(err.Error())
	}
	return s.dao.Get(parameters.Name)
}

func (s *service) List(q databaseModel.Query, _ shared.Parameters, claims *crypto.JWTCustomClaims) (interface{}, error) {
	if err := authorization.CheckUserPermission(s.rbac, claims, v1.ReadAction, v1.GlobalProject, v1.KindProject); err != nil {
		return nil, shared.HandleUnauthorizedError(err.Error())
	}
	return s.dao.List(q)
}
